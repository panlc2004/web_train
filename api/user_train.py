import _thread
import json
import os

import keras.backend as K
import numpy as np
import tensorflow as tf
# 数据准备
from keras import Model
from keras.applications.inception_resnet_v2 import preprocess_input
from keras.callbacks import ModelCheckpoint
from keras.layers import GlobalAveragePooling2D, Dense
from keras.models import load_model
from keras.optimizers import Adam
from keras.preprocessing import image
from keras.preprocessing.image import ImageDataGenerator

from api.db import query_type_info_id_by_name, update_type_info_status_running, update_type_info_status_finish, \
    update_type_info_acc
from api.web_config import train_data_save_path, h5_file_folder

IM_WIDTH, IM_HEIGHT = 299, 299  # InceptionV3指定的图片尺寸
# train_dir = 'D:/SVN File/SourceCode/deptcm/Opensource/baggage-distinguish/train_data/type/train_data'  # 训练集数据
# val_dir = 'D:/SVN File/SourceCode/deptcm/Opensource/baggage-distinguish/train_data/type/validation_data'  # 验证集数据
nb_epoch = 5
batch_size = 32
model_dict = {}
session_dict = {}
model_labels_dict = {}


# _model = None

def datagen(recognizer):
    data_folder = os.path.join(train_data_save_path, recognizer)
    train_dir = os.path.join(data_folder, 'train_data')
    val_dir = os.path.join(data_folder, 'validation_data')
    # 　图片生成器
    train_datagen = ImageDataGenerator(
        preprocessing_function=preprocess_input,
        rotation_range=30,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.2,
        rescale=1 / 255,
        zoom_range=0.2,
        horizontal_flip=True
    )
    test_datagen = ImageDataGenerator(
        preprocessing_function=preprocess_input,
        horizontal_flip=True,
        rescale=1 / 255
    )

    # 训练数据与测试数据
    train_generator = train_datagen.flow_from_directory(
        train_dir,
        target_size=(IM_WIDTH, IM_HEIGHT),
        batch_size=batch_size, class_mode='categorical')

    validation_generator = test_datagen.flow_from_directory(
        val_dir,
        target_size=(IM_WIDTH, IM_HEIGHT),
        batch_size=batch_size, class_mode='categorical')

    train_samples = train_generator.samples
    nb_classes = train_generator.num_classes

    return train_generator, validation_generator


# def inception_model():
#     # model = InceptionResNetV2(include_top=True)
#     # for layer in model.layers:
#     #     layer.trainable = False
#     # model.layers[-1].trainable = True
#     # model.layers[-2].trainable = True
#     return base_model


def gen_model(recognizer):
    train_generator, validation_generator = datagen(recognizer)
    nb_classes = train_generator.num_classes
    recognizer_id = query_type_info_id_by_name(recognizer)
    base_model = load_model('InceptionResNetV2.h5')
    x = base_model.get_layer('conv_7b_ac').output
    avg_layer_name = 'avg_poola_' + str(recognizer_id)
    x = GlobalAveragePooling2D(name=avg_layer_name)(x)
    # if nb_classes == 1:
    #     activation = 'sigmoid'
    # else:
    #     activation = 'softmax'
    predictions_layer_name = 'predictions_' + str(recognizer_id)
    x = Dense(nb_classes, activation='softmax', name=predictions_layer_name)(x)
    model = Model(base_model.input, x)
    for layer in model.layers:
        layer.trainable = False
        model.layers[-1].trainable = True
        model.layers[-2].trainable = True
    return model, train_generator, validation_generator, recognizer_id


def train_func(recognizer):
    sess = tf.Session()
    K.set_session(sess)
    with sess.graph.as_default():
        print('开始生成神经网络：' + recognizer)
        model, train_generator, validation_generator, recognizer_id = gen_model(recognizer)
        h5_file = os.path.join(h5_file_folder, recognizer + '.h5')
        checkpoint = ModelCheckpoint(h5_file, monitor='val_loss',
                                     save_weights_only=False, save_best_only=True)
        model.compile(optimizer=Adam(lr=0.001, decay=0.1), loss='categorical_crossentropy', metrics=['accuracy'])
        update_type_info_status_running(recognizer_id)
        generator = model.fit_generator(train_generator, validation_data=validation_generator, epochs=nb_epoch,
                                        callbacks=[checkpoint], workers=2)
        update_type_info_status_finish(recognizer_id)
        # 缓存神经网络信息
        print('缓存神经网络信息')
        model_dict[recognizer] = model
        session_dict[recognizer] = sess
        model_labels_dict[recognizer] = train_generator.class_indices
        print('物理存放神经网络输出标签')
        # 物理存放神经网络输出标签
        with open(os.path.join(h5_file_folder, recognizer + '.json'), 'w') as f:
            json.dump(train_generator.class_indices, f)
        final_acc = generator.history
        print(final_acc)
        update_type_info_acc(final_acc['acc'][-1], final_acc['val_acc'][-1], name=recognizer)


def train(recognizer):
    # train_func(recognizer)
    _thread.start_new_thread(train_func, (recognizer,))


def predict(recognizer, img):
    model = model_dict.get(recognizer)
    sess = session_dict.get(recognizer)
    K.set_session(sess)
    with sess.graph.as_default():
        if model is None:
            return '神经网络未训练'
        array = image.img_to_array(img.resize((299, 299)))
        img_input = np.expand_dims(array, axis=0) / 255.
        predict_res = model.predict(img_input)
        squeeze = np.squeeze(predict_res)
        index = squeeze.argsort()[::-1]
        model_labels = model_labels_dict[recognizer]
        labels = {}
        for _key in model_labels.keys():
            labels[model_labels.get(_key)] = _key
        res = []
        for i in index:
            r = {'name': labels[i], 'score': squeeze[i]}
            res.append(r)
        return res


def load_exists_modes():
    print('加载用户神经网络')
    files = os.listdir(h5_file_folder)
    for file in files:
        (filepath, tempfilename) = os.path.split(file)
        (shotname, extension) = os.path.splitext(tempfilename)
        if extension == '.h5':
            print('分类器：' + shotname + ' 加载中')
            model = load_model(os.path.join(h5_file_folder, file))
            model_dict[shotname] = model
            session_dict[shotname] = K.get_session()
        if extension == '.json':
            print('分类器：' + shotname + ' 标签资源加载中')
            with open(os.path.join(h5_file_folder, file), 'r') as f:
                labels_dict = json.load(f)
                model_labels_dict[shotname] = labels_dict


load_exists_modes()

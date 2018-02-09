import glob
import os

from keras import Model
from keras.applications.inception_resnet_v2 import preprocess_input, InceptionResNetV2
from keras.callbacks import ModelCheckpoint
from keras.layers import GlobalAveragePooling2D, Dense
from keras.models import load_model
from keras.optimizers import Adam
from keras.preprocessing.image import ImageDataGenerator


def get_nb_files(directory):
    """Get number of files by searching directory recursively"""
    if not os.path.exists(directory):
        return 0
    cnt = 0
    for r, dirs, files in os.walk(directory):
        for dr in dirs:
            cnt += len(glob.glob(os.path.join(r, dr + "/*")))
    return cnt


# 数据准备
IM_WIDTH, IM_HEIGHT = 299, 299  # InceptionV3指定的图片尺寸
FC_SIZE = 1024  # 全连接层的节点个数
NB_IV3_LAYERS_TO_FREEZE = 172  # 冻结层的数量

train_dir = 'D:/SVN File/SourceCode/deptcm/Opensource/baggage-distinguish/train_data/type/train_data'  # 训练集数据
val_dir = 'D:/SVN File/SourceCode/deptcm/Opensource/baggage-distinguish/train_data/type/validation_data'  # 验证集数据
nb_epoch = 25
batch_size = 32

nb_train_samples = get_nb_files(train_dir)  # 训练样本个数
nb_val_samples = get_nb_files(val_dir)  # 验证集样本个数
nb_classes = len(glob.glob(train_dir + "/*"))  # 分类数
nb_epoch = int(nb_epoch)  # epoch数量
batch_size = int(batch_size)

# 　图片生成器
train_datagen = ImageDataGenerator(
    preprocessing_function=preprocess_input,
    rotation_range=30,
    width_shift_range=0.2,
    height_shift_range=0.2,
    shear_range=0.2,
    zoom_range=0.2,
    horizontal_flip=True
)
test_datagen = ImageDataGenerator(
    preprocessing_function=preprocess_input,
    # rotation_range=30,
    # width_shift_range=0.2,
    # height_shift_range=0.2,
    # shear_range=0.2,
    # zoom_range=0.2,
    horizontal_flip=True
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

# inception_model = InceptionResNetV2(include_top=False)
# x = GlobalAveragePooling2D(name='avg_pool')(inception_model.output)
# x = Dense(nb_classes, activation='softmax', name='predictions')(x)
# model = Model(inception_model.input, x)

model = load_model('boxes_trained_2_epoch_2.h5')

for layer in model.layers:
    layer.trainable = False
model.layers[-1].trainable = True
model.layers[-2].trainable = True

checkpoint = ModelCheckpoint("boxes_trained_3_epoch_{epoch}.h5", monitor='val_loss',
                             save_weights_only=False, save_best_only=True)

model.compile(optimizer=Adam(lr=0.0001), loss='categorical_crossentropy', metrics=['accuracy'])

model.fit_generator(train_generator, validation_data=validation_generator, epochs=nb_epoch, callbacks=[checkpoint])

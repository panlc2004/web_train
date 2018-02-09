# -*- coding: UTF-8 -*-
import base64
import io
import os
import time

import keras.backend as K
import numpy as np
from PIL import Image
from flask import Flask, request, json, make_response, jsonify
from flask_cors import *
from keras.models import load_model
from keras.preprocessing import image
from werkzeug.contrib.fixers import ProxyFix

import api.db as db
from api.train_util import deal
from api.user_train import train, predict
from api.web_config import zip_save_path

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app)
CORS(app)

input_size = tuple((299, 299))
color_model_path = 'color_model_and_weight.h5'
boxes_model_path = 'boxes_model_and_weight.h5'

colors = ['黑色', '蓝色', '棕色', '绿色',
          '橙色', '紫色', '红色', '白色',
          '黄色']
boxes = ['背包', '拉杆箱', '快递箱', '运动包']

print('初始化行李色彩识别神经网络')
default_sess = K.get_session()
color_model = load_model(color_model_path)
print('初始化行李类型识别神经网络')
boxes_model = load_model(boxes_model_path)


def boxes_distinguish(image_data):
    array = image.img_to_array(image_data.resize(input_size))
    array = np.expand_dims(array, axis=0) / 255.
    K.set_session(default_sess)
    with default_sess.graph.as_default():
        color_model_predict = np.squeeze(color_model.predict(array))
        boxes_model_predict = np.squeeze(boxes_model.predict(array))
        print(np.sum(color_model_predict))
        print(np.sum(boxes_model_predict))
        print(np.max(color_model_predict))
        print(np.max(boxes_model_predict))
        color_model_predict_sorted = color_model_predict.argsort()[::-1]
        boxes_model_predict_sorted = boxes_model_predict.argsort()[::-1]

        return boxes[boxes_model_predict_sorted[0]], boxes_model_predict[boxes_model_predict_sorted[0]], \
               boxes[boxes_model_predict_sorted[1]], boxes_model_predict[boxes_model_predict_sorted[1]], \
               colors[color_model_predict_sorted[0]], color_model_predict[color_model_predict_sorted[0]], \
               colors[color_model_predict_sorted[1]], color_model_predict[color_model_predict_sorted[1]]


@app.route("/distinguish", methods=['POST'])
def distinguish():
    data = json.loads(request.get_data())
    if 'encodedData' in data and 'type' in data and data['type'] == 'BOXES':
        encoded_data = data['encodedData']
        decoded_data = base64.b64decode(encoded_data)
        image_data = Image.open(io.BytesIO(decoded_data))
        classes_1, classes_score_1, classes_2, classes_score_2, color_1, color_score_1, color_2, color_score_2 \
            = boxes_distinguish(image_data)
        return make_response('{"classes_1":"%s","classes_score_1":"%s","classes_2":"%s","classes_score_2":"%s",'
                             '"color_1":"%s","color_score_1":"%s","color_2":"%s","color_score_2":"%s"}' % (
                                 classes_1, classes_score_1, classes_2, classes_score_2, color_1, color_score_1,
                                 color_2, color_score_2))
    resp = make_response("参数异常：需要encodedData&type")
    resp.status_code = 500
    return resp


@app.route("/upload", methods=['POST'])
def file_upload():
    filename = 'upload_file'
    upload_file = request.files['file']
    params = request.form.to_dict()
    recognizer = params.get('recognizer')
    classname = params.get('classname')
    if not os.path.exists(zip_save_path):
        os.makedirs(zip_save_path)
    save_name = os.path.join(zip_save_path, filename + '_' + str(round(time.time() * 1000)) + '.zip')
    upload_file.save(save_name)  # 保存分片到本地
    # 解压并分类保存
    deal(save_name, recognizer, classname)
    return 'success'


@app.route("/userTrain", methods=['POST'])
def user_train():
    data = json.loads(request.get_data())
    recognizer = data['recognizer']
    # _thread.start_new_thread(train, (recognizer,))
    train(recognizer)
    return 'success'


@app.route("/findTypeInfo", methods=['GET'])
def find_type_info():
    info = db.query_type_info()
    return jsonify(info)


@app.route("/insertTypeInfo", methods=['POST'])
def insert_type_info():
    data = json.loads(request.get_data())
    name = data['name']
    info = db.insert_type_info(name)
    return jsonify(info)


@app.route("/insertDetailInfo", methods=['POST'])
def insert_detail_info():
    data = json.loads(request.get_data())
    name = data['name']
    info_id = data['infoId']
    detail = db.insert_type_detail(info_id, name)
    return jsonify(detail)


@app.route("/predict", methods=['POST'])
def user_predict():
    data = json.loads(request.get_data())
    if 'encodedData' in data:
        encoded_data = data['encodedData']
        info_id = data['id']
        recognizer = db.query_type_info_name_by_id(info_id)
        decoded_data = base64.b64decode(encoded_data)
        image_data = Image.open(io.BytesIO(decoded_data))
    res = predict(recognizer, image_data)
    # s = ''
    # for r in res:
    #     s = s + str(r['name']) + ": " + str(r['score']) + '<br/>'
    return str(res).replace("'", '"')


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)

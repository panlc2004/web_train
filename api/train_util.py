import zipfile
import os

import time

import h5py

from  api.web_config import train_data_save_path


def split_data(imgs_path, validate_percent=0.1):
    imgs_num = len(imgs_path)
    validate_num = int(imgs_num * validate_percent)
    if validate_num == 0:
        validate_num = 1
    train_num = int(imgs_num - validate_num)

    train_imgs = []
    validate_imgs = []
    if imgs_num == 0:
        return train_imgs, validate_imgs
    else:
        for i in range(0, train_num):
            train_imgs.append(imgs_path[i])
        for i in range(train_num, imgs_num):
            validate_imgs.append(imgs_path[i])
        return train_imgs, validate_imgs


def get_train_data(zip_file_path, classname):
    zip_file = zipfile.ZipFile(zip_file_path)
    file_list = zip_file.namelist()
    all_img = []
    for f in file_list:
        info = zip_file.getinfo(f)
        name = str(info.filename)
        if name.endswith('.jpg'):
            all_img.append(info.filename)
    return zip_file, all_img


def deal(zip_file_path, recognizer, classname):
    zip_file, all_img = get_train_data(zip_file_path, classname)
    train, validate = split_data(all_img)
    if len(train) > 0 and len(validate) > 0:
        copy_img_from_zip(recognizer, classname, zip_file, train, 'train_data')
        copy_img_from_zip(recognizer, classname, zip_file, validate, 'validation_data')


def copy_img_from_zip(recognizer, classname, zip_file, fina_name_list, data_types):
    for f in fina_name_list:
        info = zip_file.getinfo(f)
        zip_name = str(info.filename)
        filename = zip_name.split('/')[-1]
        simple_name = filename.split('.')[0] + '_' + str(round(time.time() * 1000)) + '.jpg'
        save_folder = os.path.join(train_data_save_path, recognizer, data_types, classname)
        save_name = os.path.join(save_folder, simple_name)
        if not os.path.exists(save_folder):
            os.makedirs(save_folder)
        img_data = zip_file.read(info.filename)
        # wb:写二进制文件
        with open(save_name, 'wb') as img:
            img.write(img_data)







# del_train_data('D:/log/test.zip')


# deal('D:/retrain/color_all/test.zip', 'zip_test', 'train')

import os

train_data_save_path = 'd:/img_data'
zip_save_path = 'd:/zip_file'
h5_file_folder = 'd:/h5_file'

if not os.path.exists(train_data_save_path):
    os.makedirs(train_data_save_path)

if not os.path.exists(zip_save_path):
    os.makedirs(zip_save_path)

if not os.path.exists(h5_file_folder):
    os.makedirs(h5_file_folder)

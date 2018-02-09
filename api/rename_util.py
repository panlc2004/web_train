import os
import tensorflow as tf


FILE_PATH = 'D:/SVN File/SourceCode/deptcm/Opensource/baggage-distinguish/train_data/color/all/black'
FILE_NAME_PREFIX = 'all-black'

for index, file in enumerate(os.listdir(FILE_PATH)):
    if file.endswith('jpg'):
        os.rename(os.path.join(FILE_PATH, file),
                  os.path.join(FILE_PATH, FILE_NAME_PREFIX + '-' + str(index + 1) + '.jpg'))
    if file.endswith('png'):
        os.rename(os.path.join(FILE_PATH, file),
                  os.path.join(FILE_PATH, FILE_NAME_PREFIX + '-' + str(index + 1) + '.png'))
    if file.endswith('jpeg'):
        os.rename(os.path.join(FILE_PATH, file),
                  os.path.join(FILE_PATH, FILE_NAME_PREFIX + '-' + str(index + 1) + '.jpeg'))

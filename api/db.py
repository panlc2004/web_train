import pymysql.cursors


def get_conn():
    print('开始建立数据库连接')
    conn = pymysql.connect(host='10.131.0.126',
                           port=3306,
                           user='root',
                           password='mysql3306',
                           db='baggage',
                           charset='utf8',
                           cursorclass=pymysql.cursors.DictCursor)
    return conn


def insert_type_info(name):
    sql = "insert into type_info (name) VALUES ('" + str(name) + "')"
    conn = get_conn()
    cursor = conn.cursor()
    try:
        cursor.execute(sql)
        conn.commit()
        insert_id = cursor.lastrowid
    finally:
        cursor.close()
        conn.close()
    return insert_id


def query_type_info():
    print('开始查询分类器信息')
    sql = "select * from type_info"
    conn = get_conn()
    cursor = conn.cursor()
    try:
        cursor.execute(sql)
        result = cursor.fetchall()
    finally:
        print('开始释放服务器资源')
        cursor.close()
        conn.close()
    for res in result:
        res['created_t'] = str(res['created_t'])
        detail = query_type_detail(res['id'])
        res['detail'] = detail
    return result


def query_type_info_name_by_id(info_id):
    sql = "select * from type_info where id = " + str(info_id)
    conn = get_conn()
    cursor = conn.cursor()
    try:
        cursor.execute(sql)
        result = cursor.fetchone()
    finally:
        cursor.close()
        conn.close()
    return result['name']


def query_type_info_id_by_name(name):
    sql = "select * from type_info where name = '" + str(name) + "'"
    conn = get_conn()
    cursor = conn.cursor()
    try:
        cursor.execute(sql)
        result = cursor.fetchone()
    finally:
        cursor.close()
        conn.close()
    return result['id']


def update_type_info_status_finish(type_id):
    update_type_info_status(type_id, 3)


def update_type_info_status_running(type_id):
    update_type_info_status(type_id, 2)


def update_type_info_status_untrain(type_id):
    update_type_info_status(type_id, 1)


def update_type_info_status(type_id, status):
    sql = "update type_info set train_status = " + str(status) + "  where id = " + str(type_id)
    conn = get_conn()
    cursor = conn.cursor()
    try:
        cursor.execute(sql)
        conn.commit()
    finally:
        cursor.close()
        conn.close()


def insert_type_detail(info_id, name):
    sql = "insert into type_detail (info_id, name) VALUES (" + str(info_id) + ", '" + str(name) + "')"
    conn = get_conn()
    cursor = conn.cursor()
    try:
        cursor.execute(sql)
        conn.commit()
        insert_id = cursor.lastrowid
    finally:
        cursor.close()
        conn.close()
    return insert_id


def query_type_detail(info_id=''):
    sql = "select * from type_detail"
    conn = get_conn()
    if info_id != '':
        sql = sql + " where info_id = " + str(info_id)
    cursor = conn.cursor()
    try:
        cursor.execute(sql)
        result = cursor.fetchall()
        for res in result:
            res['created_t'] = str(res['created_t'])
    finally:
        cursor.close()
        conn.close()
    return result


def update_type_info_acc(acc, val_acc, name):
    sql = "update type_info set acc = " + str(acc) + ", val_acc=" + str(val_acc) + "  where name = '" + str(name) + "'"
    conn = get_conn()
    cursor = conn.cursor()
    try:
        cursor.execute(sql)
        conn.commit()
    finally:
        cursor.close()
        conn.close()

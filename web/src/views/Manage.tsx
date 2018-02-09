import * as React from 'react';
import Table from 'antd/es/table/Table';
import Axios, {AxiosError, AxiosResponse} from 'axios';
import {message} from 'antd';
import Button from 'antd/es/button/button';
import Input from 'antd/es/input/Input';
import Row from 'antd/es/grid/row';
import Col from 'antd/es/grid/col';
import Modal from 'antd/es/modal/Modal';
import {ColumnProps} from 'antd/es/table';
import Upload from 'antd/es/upload/Upload';
import {UploadChangeParam} from 'antd/es/upload';

export class ClassifierItemInfo {
    id: number;
    name: string;
}

export class ClassifierItemProps {
    recognizer: string;
    items: Array<ClassifierItemInfo>;
}

export class ClassifierItem extends React.Component<ClassifierItemProps, {}> {

    columns: Array<{}>;

    constructor(props: ClassifierItemProps) {
        super(props);
        this.columns = [
            {title: '类型', dataIndex: 'name', key: 'name', width: '30%'},
            {title: '添加时间', dataIndex: 'created_t', key: 'created_t', width: '30%'},
            {
                title: '操作',
                dataIndex: '',
                key: 'Action',
                width: '40%',
                render: (text: string, record: ClassifierItemInfo) => (
                    <div>
                        <Row gutter={5}>
                            <Col span={12}>
                                <Upload
                                    name={'file'}
                                    accept={'.zip'}
                                    data={() => {
                                        return {classname: record.name, recognizer: this.props.recognizer};
                                    }}
                                    // showUploadList={{showRemoveIcon: false, showPreviewIcon: true}}
                                    showUploadList={false}
                                    action={Axios.defaults.baseURL + '/upload'}
                                    onChange={(info: UploadChangeParam) => {
                                        if (info.file.status !== 'uploading') {
                                            console.log(info.file, info.fileList);
                                        }
                                        if (info.file.status === 'done') {
                                            message.success(`${info.file.name} file uploaded successfully`);
                                        } else if (info.file.status === 'error') {
                                            message.error(`${info.file.name} file upload failed.`);
                                        }
                                    }}
                                >
                                    <Button type={'primary'}>添加训练集</Button>
                                </Upload>
                            </Col>
                            {/*<Col span={12}><Button type={'danger'}>删除训练集</Button></Col>*/}
                        </Row>
                    </div>
                )
            },
        ];
    }

    render() {
        return (
            <div>
                <Table rowKey={'id'} pagination={false} columns={this.columns} dataSource={this.props.items}/>
            </div>
        );
    }
}

export class QueryParam {
    name: string;
    status: string;
}

export class Record {
    id: number;
    name: string;
    createDate: string;
    status: string;
    acc: string | number;
    valAcc: string | number;
    items: Array<ClassifierItemInfo>;
}

export class ManageState {
    id: number;
    data: Array<Record>;
    queryParam: QueryParam;
    modelType: number;
    modelTitle: string;
    addModelVisible: boolean;
    addClassifierName: string;
    addID: number;
    loading: boolean;
}

export default class Manage extends React.Component<{}, ManageState> {
    columns: ColumnProps<{}>[];

    constructor(props: {}) {
        super(props);
        this.columns = [
            {title: '名称', dataIndex: 'name', key: 'name', width: '14%'},
            {title: '创建时间', dataIndex: 'createDate', key: 'createDate', width: '14%'},
            {title: '状态', dataIndex: 'status', key: 'status', width: '14%'},
            {title: '训练集正确率', dataIndex: 'acc', key: 'acc', width: '14%'},
            {title: '验证集正确率', dataIndex: 'valAcc', key: 'valAcc', width: '14%'},
            {
                title: '操作',
                dataIndex: '',
                key: 'Action',
                width: '30%',
                render: (text: string, record: Record) => (
                    <div>
                        <Row gutter={5}>
                            <Col span={8}>
                                <Button
                                    type={'primary'}
                                    onClick={() => {
                                        this.setState({
                                            modelTitle: '请输入类别名称',
                                            addModelVisible: true,
                                            modelType: 2,
                                            addClassifierName: '',
                                            addID: record.id
                                        });
                                    }}
                                >
                                    添加类别
                                </Button></Col>
                            <Col span={8}>
                                <Button
                                    onClick={() => {
                                        Axios.post('/userTrain', {
                                            recognizer: record.name
                                        })
                                            .then(() => {
                                                message.success('任务成功启动');
                                                this.loadClassifier();
                                            })
                                            .catch(() => {
                                                message.error('任务启动失败');
                                            });
                                    }}
                                    type={'primary'}
                                >开始训练
                                </Button>
                            </Col>
                            {/*<Col span={8}><Button type={'danger'}>删除分类器</Button></Col>*/}
                        </Row>
                    </div>
                )
            },
        ];
        this.state = {
            modelTitle: '',
            queryParam: {name: '', status: ''},
            id: 1,
            addClassifierName: '',
            addModelVisible: false,
            modelType: 1,
            data: [],
            addID: 0,
            loading: false
        };
    }

    loadClassifier() {
        this.setState({loading: true});
        Axios.get('/findTypeInfo')
            .then((response: AxiosResponse) => {
                let data = response.data;
                let newData = [];
                for (let v of data) {
                    let r = new Record();
                    r.name = v.name;
                    r.id = v.id;
                    r.status = v.train_status === 1 ? '未训练' : v.train_status === 2 ? '训练中' : '训练完成';
                    r.createDate = v.created_t;
                    r.acc = v.acc * 100 + '%';
                    r.valAcc = v.val_acc * 100 + '%';
                    if ('detail' in v) {
                        r.items = v.detail;
                    } else {
                        r.items = [];
                    }
                    newData.push(r);
                }
                this.setState({
                    queryParam: {name: '', status: ''},
                    addClassifierName: '',
                    id: 1,
                    addModelVisible: false,
                    data: newData
                });
                this.setState({loading: false});
            })
            .catch((error: AxiosError) => {
                message.error('网络错误');
                this.setState({loading: false});
            });
    }

    componentDidMount() {
        this.loadClassifier();
    }

    handleQuery = () => {
        message.info('实现查询分类器' + this.state.queryParam.name);
    };

    handleAdd = () => {
        this.setState({addModelVisible: true, modelType: 1, modelTitle: '请输入分类器名字'});
    };

    render() {
        return (
            <div>
                <p style={{textAlign: 'center'}}>分类器信息</p>
                <Row gutter={32} style={{marginBottom: '10px'}}>
                    {/*<Col span={6}>*/}
                    {/*<div>*/}
                    {/*<Input*/}
                    {/*value={this.state.queryParam.name}*/}
                    {/*style={{float: 'left'}}*/}
                    {/*placeholder={'名字'}*/}
                    {/*onChange={(e) => {*/}
                    {/*let queryParam = this.state.queryParam;*/}
                    {/*queryParam.name = e.target.value;*/}
                    {/*this.setState({queryParam: queryParam});*/}
                    {/*}}*/}
                    {/*/>*/}
                    {/*</div>*/}
                    {/*</Col>*/}
                    {/*<Col span={6}>*/}
                    {/*<div>*/}
                    {/*<Input*/}
                    {/*placeholder={'状态'}*/}
                    {/*onChange={(e) => {*/}
                    {/*let queryParam = this.state.queryParam;*/}
                    {/*queryParam.status = e.target.value;*/}
                    {/*this.setState({queryParam: queryParam});*/}
                    {/*}}*/}
                    {/*/>*/}
                    {/*</div>*/}
                    {/*</Col>*/}
                    {/*<Col span={6}>*/}
                    {/*<Button*/}
                    {/*onClick={this.handleQuery}*/}
                    {/*style={{marginRight: '5px'}}*/}
                    {/*type={'primary'}*/}
                    {/*icon={'search'}*/}
                    {/*>查询*/}
                    {/*</Button>*/}
                    {/*<Button onClick={this.handleAdd} type={'primary'} icon={'plus'}>新建</Button>*/}
                    {/*</Col>*/}
                    <Button
                        style={{marginLeft: '15px'}}
                        onClick={this.handleAdd}
                        type={'primary'}
                        icon={'plus'}
                    >新建
                    </Button>
                </Row>
                <Table
                    rowKey={'id'}
                    loading={this.state.loading}
                    columns={this.columns}
                    expandedRowRender={(record: Record) =>
                        <div>
                            <ClassifierItem recognizer={record.name} items={record.items}/>
                        </div>}
                    dataSource={this.state.data}
                />
                <Modal
                    visible={this.state.addModelVisible}
                    title={this.state.modelTitle}
                    onCancel={() => {
                        this.setState({addModelVisible: false, addClassifierName: ''});
                    }}
                    footer={[
                        <Button
                            key="back"
                            onClick={() => {
                                this.setState({addClassifierName: ''});
                                this.setState({addModelVisible: false});
                            }}
                        >取消
                        </Button>,
                        <Button
                            key="submit"
                            type="primary"
                            onClick={() => {
                                this.setState({addClassifierName: this.state.addClassifierName.trim()});
                                if (this.state.addClassifierName.trim().length === 0) {
                                    return;
                                }
                                let url = '';
                                let data = {};
                                if (this.state.modelType === 1) {
                                    url = '/insertTypeInfo';
                                    let exp = new RegExp('^[A-Za-z0-9]+$');
                                    let ok = exp.test(this.state.addClassifierName);
                                    if (!ok) {
                                        return;
                                    }
                                    data = {
                                        name: this.state.addClassifierName
                                    };
                                } else {
                                    url = '/insertDetailInfo';
                                    data = {
                                        name: this.state.addClassifierName,
                                        infoId: this.state.addID
                                    };
                                }
                                Axios.post(url, data)
                                    .then((response: AxiosResponse) => {
                                        message.success('新建成功');
                                        this.loadClassifier();
                                    })
                                    .catch((error: AxiosError) => {
                                        message.error('新建失败');
                                    });
                            }}
                        >提交
                        </Button>,
                    ]}
                >
                    <Row gutter={32}>
                        <Input
                            value={this.state.addClassifierName}
                            placeholder="名字"
                            onChange={(e) => {
                                this.setState({addClassifierName: e.target.value});
                            }}
                        />
                    </Row>
                </Modal>
            </div>
        )
            ;
    }
}
import * as React from 'react';
import Axios, {AxiosResponse} from 'axios';
import {message} from 'antd';
import {Record} from './Manage';
import Menu from 'antd/es/menu';
import Icon from 'antd/es/icon';
import Button from 'antd/es/button/button';
import Dropdown from 'antd/es/dropdown/dropdown';

export interface Result {
    name: string;
    score: number;
}

export interface DistinguishState {
    imageData: string
    classifiers: Array<Record>;
    distinguishResult: Array<Result>;
}

export default class Distinguish extends React.Component <{}, DistinguishState> {

    constructor(props: {}) {
        super(props);
        this.state = {
            imageData: '',
            // classifiers: [{id: 1, name: 'test', createDate: '1', status: '1', items: []}]
            classifiers: [],
            distinguishResult: []
        };
    }

    loadClassifier() {
        Axios.get('/findTypeInfo')
            .then(response => {
                let data = response.data;
                let newData = [];
                for (let v of data) {
                    let r = new Record();
                    r.name = v.name;
                    r.id = v.id;
                    r.status = v.train_status === 1 ? '未训练' : v.train_status === 2 ? '训练中' : '训练完成';
                    r.createDate = v.created_t;
                    if ('detail' in v) {
                        r.items = v.detail;
                    } else {
                        r.items = [];
                    }
                    newData.push(r);
                }
                this.setState({
                    classifiers: newData
                });
            })
            .catch(error => {
                message.error('网络错误');
            });
    }

    componentDidMount() {
        this.loadClassifier();
    }

    getBase64 = (img: File, callback: (result: string) => void) => {
        if (img) {
            const reader = new FileReader();
            reader.addEventListener('load', () => callback(reader.result));
            reader.readAsDataURL(img);
        }
    };

    handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target && e.target.files && e.target.files[0]) {
            this.getBase64(e.target.files[0], result => {
                this.setState({'imageData': result});
            });
        }
    };

    distinguish = () => {
        Axios.post('/distinguish', {
            encodedData: this.state.imageData.substr(23),
            type: 'BOXES'
        })
            .then((response: AxiosResponse) => {
                if (response.status === 200) {
                    // let data = response.data;
                    // this.setState({
                    //     classes_1: data.classes_1,
                    //     classes_score_1: data.classes_score_1,
                    //     classes_2: data.classes_2,
                    //     classes_score_2: data.classes_score_2,
                    //     color_1: data.color_1,
                    //     color_score_1: data.color_score_1,
                    //     color_2: data.color_2,
                    //     color_score_2: data.color_score_2,
                    // });
                } else {
                    message.error(response.data);
                }
            })
            .catch((error) => {
                if (error.response && error.response.data) {
                    message.error(error.response.data);
                } else {
                    message.error(error.message);
                }
            });
    };

    render() {
        return (
            <div style={{margin: '0 auto', width: 400}}>
                <div>
                    <div>
                        <img src={this.state.imageData} width="323" height="323"/>
                    </div>
                    <div style={{paddingTop: '5px', marginLeft: '5px'}}>
                        <input type="file" accept={'.jpg'} onChange={this.handleChange}/>
                        <Dropdown
                            overlay={(
                                <Menu
                                    onClick={(e) => {
                                        if (this.state.imageData.length !== 0) {
                                            this.setState({distinguishResult: []});
                                            Axios.post('/predict', {
                                                encodedData: this.state.imageData.substr(23),
                                                id: e.key
                                            })
                                                .then(r => {
                                                    if (r.data === '神经网络未训练') {
                                                        message.error(r.data);
                                                    } else {
                                                        this.setState({distinguishResult: r.data});
                                                    }
                                                })
                                                .catch(er => {
                                                    message.error('服务端异常');
                                                });
                                        }
                                    }}
                                >
                                    {this.state.classifiers.map(item => {
                                        return (
                                            <Menu.Item key={item.id}>{item.name}</Menu.Item>
                                        );
                                    })}
                                </Menu>
                            )}
                        >
                            <Button>
                                识别<Icon type="down"/>
                            </Button>
                        </Dropdown>
                    </div>
                </div>
                <div>
                    {this.state.distinguishResult.map((item, index) => {
                        return (
                            <div key={index}>
                                {item.name}:{item.score}
                            </div>
                        );
                    })}
                    {/*<p>*/}
                    {/*类型：{this.state.classes_1 + '(' + this.state.classes_score_1 + '),'*/}
                    {/*+ this.state.classes_2 + '(' + this.state.classes_score_2 + ')'}*/}
                    {/*</p>*/}
                    {/*<p>颜色：{this.state.color_1 + '(' + this.state.color_score_1 + '),'*/}
                    {/*+ this.state.color_2 + '(' + this.state.color_score_2 + ')'}</p>*/}
                </div>
            </div>
        );
    }
}
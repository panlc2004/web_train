import * as React from 'react';
import Axios, {AxiosResponse} from 'axios';
import {message} from 'antd';

export interface BoxesDistinguishState {
    imageData: string
    classes_1: string
    classes_score_1: string | number
    classes_2: string
    classes_score_2: string | number
    color_1: string
    color_score_1: string | number
    color_2: string
    color_score_2: string | number
}

export default class BoxesDistinguish extends React.Component <{}, BoxesDistinguishState> {

    constructor(props: {}) {
        super(props);
        this.state = {
            imageData: '',
            classes_1: '',
            classes_score_1: 0,
            classes_2: '',
            classes_score_2: 0,
            color_1: '',
            color_score_1: 0,
            color_2: '',
            color_score_2: 0
        };
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
        this.setState({
            classes_1: '',
            classes_score_1: '',
            classes_2: '',
            classes_score_2: '',
            color_1: '',
            color_score_1: '',
            color_2: '',
            color_score_2: '',
        });
        Axios.post('/distinguish', {
            encodedData: this.state.imageData.substr(23),
            type: 'BOXES'
        })
            .then((response: AxiosResponse) => {
                if (response.status === 200) {
                    let data = response.data;
                    this.setState({
                        classes_1: data.classes_1,
                        classes_score_1: data.classes_score_1,
                        classes_2: data.classes_2,
                        classes_score_2: data.classes_score_2,
                        color_1: data.color_1,
                        color_score_1: data.color_score_1,
                        color_2: data.color_2,
                        color_score_2: data.color_score_2,
                    });
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
                        <input type="file" onChange={this.handleChange}/>
                        <button onClick={this.distinguish}>识别</button>
                    </div>
                </div>
                <div>
                    <p>
                        类型：{this.state.classes_1 + '(' + this.state.classes_score_1 + '),'
                    + this.state.classes_2 + '(' + this.state.classes_score_2 + ')'}
                    </p>
                    <p>颜色：{this.state.color_1 + '(' + this.state.color_score_1 + '),'
                    + this.state.color_2 + '(' + this.state.color_score_2 + ')'}</p>
                </div>
            </div>
        );
    }
}
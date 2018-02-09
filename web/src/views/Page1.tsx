import * as React from 'react';
import Axios, {AxiosResponse} from 'axios';
import {message} from 'antd';

export interface BoxesDistinguishState {
    imageData: string
    classes: string
    color: string
    classes_score: string | number
    color_score: string | number
}

export default class BoxesDistinguish extends React.Component <{}, BoxesDistinguishState> {

    constructor(props: {}) {
        super(props);
        this.state = {imageData: '', classes: '', color: '', classes_score: 0, color_score: 0};
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
        Axios.post('http://10.131.11.75:5000/distinguish', {
            encodedData: this.state.imageData.substr(23),
            type: 'BOXES'
        })
            .then((response: AxiosResponse) => {
                if (response.status === 200) {
                    let data = response.data;
                    this.setState({
                        classes: data.classes,
                        color: data.color,
                        color_score: data.color_score,
                        classes_score: data.classes_score,
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
                    <span style={{float: 'left'}}>类型：{this.state.classes + '(' + this.state.classes_score + ')'}</span>
                    <span style={{float: 'right'}}>颜色：{this.state.color + '(' + this.state.color_score + ')'}</span>
                </div>
            </div>
        );
    }
}
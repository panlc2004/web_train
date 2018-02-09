import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import './index.less';
import Axios from 'axios';

if (process.env.NODE_ENV === 'production') {
    Axios.defaults.baseURL = 'http://10.131.0.121:5000';
} else {
    Axios.defaults.baseURL = 'http://127.0.0.1:5000';
}

ReactDOM.render(
    <App/>,
    document.getElementById('root') as HTMLElement
);
registerServiceWorker();

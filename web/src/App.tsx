import * as React from 'react';
import {Icon, Layout, Menu} from 'antd';
import {Link, Route, Router} from 'react-router-dom';
import BoxesDistinguish from './views/BoxesDistinguish';
import Distinguish from './views/Distinguish';
import Manage from './views/Manage';
import createHashHistory from 'history/createHashHistory';

const hashHistory = createHashHistory();
const {Content, Footer, Sider} = Layout;

export interface AppState {
    collapsed: boolean
}

class App extends React.Component<{}, AppState> {

    constructor(props: {}, state: AppState) {
        super(props, state);
        this.state = {collapsed: false};
    }

    onCollapse = (collapsed: boolean) => {
        this.setState({collapsed: collapsed});
    };

    render() {
        return (
            <Router history={hashHistory}>
                <Layout style={{minHeight: '100vh'}}>
                    <Sider
                        collapsible={true}
                        collapsed={this.state.collapsed}
                        onCollapse={this.onCollapse}
                    >
                        <Menu theme="dark" mode="inline">
                            <Menu.Item key="1">
                                <Icon type="pie-chart"/>
                                <span>行李识别</span>
                                <Link to="/boxes-distinguish"/>
                            </Menu.Item>
                            <Menu.Item key="2">
                                <Icon type="pie-chart"/>
                                <span>分类器测试</span>
                                <Link to="/distinguish"/>
                            </Menu.Item>
                            <Menu.Item key="3">
                                <Icon type="desktop"/>
                                <span>分类器管理</span>
                                <Link to="/manage"/>
                            </Menu.Item>
                        </Menu>
                    </Sider>
                    <Layout>
                        <Content style={{margin: '0 16px'}}>
                            {/*<Breadcrumb style={{margin: '16px 0'}}>*/}
                            {/*<Breadcrumb.Item>User</Breadcrumb.Item>*/}
                            {/*<Breadcrumb.Item>Bill</Breadcrumb.Item>*/}
                            {/*</Breadcrumb>*/}
                            <div style={{padding: 24, background: '#fff'}}>
                                <Route path="/boxes-distinguish" component={BoxesDistinguish}/>
                                <Route path="/manage" component={Manage}/>
                                <Route path="/distinguish" component={Distinguish}/>
                            </div>
                        </Content>
                        <Footer style={{textAlign: 'center'}}>
                            Distinguish ©2018 Created by CZY
                        </Footer>
                    </Layout>
                </Layout>
            </Router>
        );
    }
}

export default App;
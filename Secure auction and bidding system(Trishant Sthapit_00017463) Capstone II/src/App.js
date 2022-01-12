import './App.css';
import {BrowserRouter as Router, Route, Redirect, Switch} from 'react-router-dom';
import Layout from './utils/Layout';
import HelperFunctions from './utils/Util';
import Home from './pages/Home';
import MarketPlaceBuy from './pages/MarketPlaceBuy';
import MarketPlaceSell from './pages/MarketPlaceSell';
import Unauthorized from './pages/Unathorized';
import NotFound from './pages/NotFound';
import { Component } from 'react';
import getWeb3 from "./getWeb3";
import SecureAuction from "./abis/SecureAuction.json";
import PriceConsumerV3 from './abis/PriceConsumerV3.json';


require('dotenv').config();

class App extends Component {

  constructor(props){
    super(props);
    this.state = {
      web3: null, 
      accounts: null, 
      contract: null,
      isAuthenticated: true,
      pageLoading: true
    };

  }

  componentWillUnmount=()=>{
    localStorage.removeItem('isAuthenticated');
  }

  componentDidMount = async ()=>{
    try{
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();
      const myContractAddress = '0x01c9Ef9f1b0D07d707F27c2174A6cF7D89dBF2b1';

      const priceFeedContractAddr = '0x877002bC1fE59204D5cbF26D91Bd0383f7CA492E';

      // Get the contract instance.
      const instance = new web3.eth.Contract(SecureAuction.abi,
        myContractAddress);
        console.log('instance', instance);

      const priceFeedInstance = new web3.eth.Contract(PriceConsumerV3.abi,
        priceFeedContractAddr);
        console.log('priceFeedInstance', priceFeedInstance);

      localStorage.setItem('accounts',accounts);
      this.setState({web3: web3, accounts: accounts, contract: instance, priceFeed: priceFeedInstance });
    }
    catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }    
  };

  render(){
    return (
      <div className="App">
        <Router>      
        <Layout baseAppState={this.state}>   
            <Switch>
              <Route exact path="/" render={()=>{return(this.state.isAuthenticated ? <Redirect to="/home"/> : <Redirect to="/unauthorized"/>)}} />            
              <Route exact path="/marketplace" render={()=>{return(this.state.isAuthenticated ? <Redirect to="/marketplace/sell"/> : <Redirect to="/unauthorized"/>)}} />            
              
              <Route exact path="/home" render={props => {return(this.state.isAuthenticated ? <Home {...props} baseAppState={this.state} />  : <Redirect to="/unauthorized"/> )} } />
              <Route exact path="/marketplace/buy" render={props => {return(this.state.isAuthenticated ? <MarketPlaceBuy {...props} baseAppState={this.state} />  : <Redirect to="/unauthorized"/> )} } />
              <Route exact path="/marketplace/sell" render={props => {return(this.state.isAuthenticated ? <MarketPlaceSell {...props} baseAppState={this.state} />  : <Redirect to="/unauthorized"/> )} } />
              <Route exact path="/unauthorized" render={props => {return(this.state.isAuthenticated ? <Redirect to="/home"/>  : <Unauthorized {...props} baseAppState={this.state} /> )}} />
              <Route path="/404" render={props => {return(<NotFound  {...props} />)}} />
              <Redirect to="/404" />            
            </Switch>
          </Layout>
        </Router>
      </div>
    );
  }
}

export default App;

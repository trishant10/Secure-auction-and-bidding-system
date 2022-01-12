import React, { Component } from "react";
import { MDBNavbar, MDBNavbarBrand, MDBNavbarNav, MDBNavItem, MDBNavLink, MDBNavbarToggler, MDBCollapse, MDBDropdown,
MDBDropdownToggle, MDBDropdownMenu, MDBDropdownItem, MDBContainer, MDBIcon, MDBTypography } from "mdbreact";
import '../styles/navbar.scss';
import { NavLink } from "react-bootstrap";
import Util from '../utils/Util';
import Spinner from "./Spinner";

class NavbarPage extends Component {
  constructor(props){
    
    super(props);
    this.state = {
      collapseID: "",
      accounts: this.props.baseAppState.accounts,
      maskedAccount: ''
    };    
  }
  
  componentDidMount(){
    if(!this.state.accounts){
        this.setState({accounts: localStorage.getItem('accounts')});
    }    
  }

  componentDidUpdate(){
    let util = new Util();
    if(!this.state.accounts && this.props.baseAppState){
            
    }else{
      if(!this.state.maskedAccount && this.state.accounts){
        this.setState({maskedAccount: this.state.accounts});
      }
    }
  }

  toggleCollapse = collapseID => () =>
    this.setState(prevState => ({
    collapseID: prevState.collapseID !== collapseID ? collapseID : ""
  }));

  render() {
    
    return (
      <MDBNavbar color="info-color" dark expand="md" style={{ marginTop: "20px" }}>
            <MDBNavLink to="/">
              <MDBNavbarBrand>
                <strong className="white-text">Secure Auction and Bidding Marketplace</strong>
              </MDBNavbarBrand>
            </MDBNavLink>
            <MDBNavbarToggler onClick={this.toggleCollapse("navbarCollapse3")} />
            <MDBCollapse id="navbarCollapse3" isOpen={this.state.collapseID} navbar>
              <MDBNavbarNav right>
                <MDBNavItem>
                  <span className="text-white" style={{position:'relative', top:'12px', marginRight: '20px'}}>
                    {this.state.maskedAccount ? 
                      <strong>Current Account: {this.state.maskedAccount}</strong>
                    : <Spinner size="small"/>}
                  </span>
                </MDBNavItem>
                <MDBNavItem>
                  <MDBDropdown>
                    <MDBDropdownToggle nav>
                      <img src="https://w7.pngwing.com/pngs/518/320/png-transparent-computer-icons-mobile-app-development-android-my-account-icon-blue-text-logo-thumbnail.png" className="rounded-circle z-depth-0"
                        style={{ height: "35px", padding: 0 }} alt="" />                    
                    </MDBDropdownToggle>
                    <MDBDropdownMenu className="dropdown-default" right>
                      <MDBDropdownItem href="#!">My account</MDBDropdownItem>
                      <MDBDropdownItem href="#!">Log out</MDBDropdownItem>
                    </MDBDropdownMenu>
                  </MDBDropdown>
                </MDBNavItem>
              </MDBNavbarNav>
            </MDBCollapse>
          </MDBNavbar>      
    );  
  }
}
export default NavbarPage;
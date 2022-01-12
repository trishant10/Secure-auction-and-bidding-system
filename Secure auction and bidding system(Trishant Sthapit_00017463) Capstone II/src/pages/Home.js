import { MDBAnimation, MDBCol, MDBContainer, MDBRow } from 'mdbreact';
import React, { Component } from 'react';
import MenuCard from '../components/Card';
import {Link} from 'react-router-dom';

class Home extends Component {
    constructor(props){
        super(props);
        this.state = {
            expiringAuctionItems: [],
            contract: this.props.baseAppState.contract
        }
    }

    render() {
        return (
            <MDBContainer className="page-container">
                <MDBRow>
                    <MDBCol md="9" lg="9" xl="9">
                        <MDBRow>
                            <MDBCol sm="6" md="6" lg="6" xl="6" className="menu-card p-2">
                                <MDBAnimation type="bounceIn">
                                    <Link to='/marketplace/buy'>
                                        <MenuCard 
                                            title="BIDDING"
                                            description="Click to Participate"
                                            imageSrc={'https://necu.ac.in/wp-content/uploads/2019/12/Facebook-enhanced-bidding.jpg'} 
                                           
                                        />
                                    </Link>
                                </MDBAnimation>
                            </MDBCol>
                            <MDBCol sm="6" md="6" lg="6" xl="6" className="menu-card p-2">
                                <MDBAnimation type="bounceIn" delay=".4s">
                                    <Link to='/marketplace/sell'>
                                        <MenuCard 
                                            title="AUCTION"
                                            description="Add item for auction" 
                                            imageSrc={'https://geauction.com/wp-content/uploads/2018/07/5-Auction-Tips-for-Beginners2.jpg'} 
                                        
                                        />
                                    </Link>
                                </MDBAnimation>
                            </MDBCol>                                     
                        </MDBRow>
                    </MDBCol>
                    
                    
                </MDBRow>
            </MDBContainer>
        );
    }
}

export default Home;

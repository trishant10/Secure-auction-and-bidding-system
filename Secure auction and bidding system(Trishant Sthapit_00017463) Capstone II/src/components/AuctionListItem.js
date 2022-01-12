import { MDBCard, MDBCol, MDBIcon, MDBRow, MDBTypography, MDBView } from 'mdbreact';
import React from 'react';

import ReactTimeAgo from 'react-time-ago';
import Time from 'react-time-format';

import '../styles/auctionlistitem.scss';


const AuctionListItem = (props) => {
    const onCancelClick = ()=>{
        props.onCancelCallback();
    }

    return (
        <MDBView hover waves>
            <MDBCard className="art-list-item-wrapper">
                <MDBRow>
                    <MDBCol size="2" >
                        <MDBIcon far icon="file-image" size="3x" style={{color: 'rgba(130,130,130,1)'}}/>
                    </MDBCol>
                    <MDBCol size="10">
                        <MDBTypography tag='h6' variant="h6-responsive">{props.auctionTitle}</MDBTypography>
                        {props.time ? 
                            
                            <Time value={props.time} format="DD-MM-YYYY" />
                        : null}                        
                        <MDBRow>
                            <MDBCol size="5">
                                <MDBIcon far icon="clock" /> {props.timeLeft}
                            </MDBCol>
                            <MDBCol size="7">
                                <MDBIcon icon="dollar-sign" /> {new Intl.NumberFormat().format(props.currentHighestBid)}
                            </MDBCol>
                        </MDBRow>
                    </MDBCol>
                </MDBRow>        
            </MDBCard>        
        </MDBView>
    );
};

export default AuctionListItem;
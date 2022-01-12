import React, { Component } from 'react';
import AuctionListItem from './AuctionListItem';
import '../styles/sidebar.scss';

class ClosingArtsSideBarList extends Component {

    render() {
        return (
            <div className="art-side-bar-wrapper pr-2">
                <AuctionListItem auctionTitle="Leonardo Da Vinci" currentHighestBid="4500" timeLeft="60" />
                <AuctionListItem auctionTitle="Leonardo Da Vinci" currentHighestBid="4500" timeLeft="60" />
                <AuctionListItem auctionTitle="Leonardo Da Vinci" currentHighestBid="4500" timeLeft="60" />
                <AuctionListItem auctionTitle="Leonardo Da Vinci" currentHighestBid="4500" timeLeft="60" />
                <AuctionListItem auctionTitle="Leonardo Da Vinci" currentHighestBid="4500" timeLeft="60" />
                <AuctionListItem auctionTitle="Leonardo Da Vinci" currentHighestBid="4500" timeLeft="60" />
                <AuctionListItem auctionTitle="Leonardo Da Vinci" currentHighestBid="4500" timeLeft="60" />
                <AuctionListItem auctionTitle="Leonardo Da Vinci" currentHighestBid="4500" timeLeft="60" />
                <AuctionListItem auctionTitle="Leonardo Da Vinci" currentHighestBid="4500" timeLeft="60" />
            </div>
        );
    }
}

export default ClosingArtsSideBarList;
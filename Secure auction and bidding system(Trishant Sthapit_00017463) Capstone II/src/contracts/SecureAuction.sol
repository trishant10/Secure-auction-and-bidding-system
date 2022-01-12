pragma solidity ^0.6.3;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract SecureAuction is ERC721 {
   
    using SafeMath for uint256; 



    /****     STATE VARIABLES      ***** */


    //static and constant state variables
    mapping(uint256 => AuctionItem) private _auctionItems;  
    address public owner;   

    //dynamic and changing state variables
    uint256 public _tokenIds;  
    uint256 public _auctionItemIds;    
 
    mapping(uint256=>mapping(address => uint256)) public fundsByBidder;    
    mapping(int256=>uint256) token; 
    mapping(uint256=>bidding) public bid;  
    bool firsttime = false;  




    /*****      EVENTS      ****** */


    event LogBid(address indexed bidder, uint indexed auctionItemId, uint bid, address indexed highestBidder, uint highestBid, uint highestBindingBid);  
    event LogWithdrawal(uint indexed auctionItemId, address indexed withdrawer, address indexed withdrawalAccount, uint amount);
    event LogCanceled(uint256 indexed auctionItemId,address indexed seller,address indexed winner);
    event LogAddItem(uint256 _auctionItemIds, string name, address payable indexed seller, uint256 price, uint nowTime, uint timePeriod);

  

    /*****     STRUCTS      ****** */


    struct AuctionItem {
        address payable seller; 
        uint256 minbid; 
        string tokenURI;  
        bool exists;    
        uint bidIncrement; 
        uint time;         
        uint timePeriod; 
        bool cancelled;     
        bool auctionstarted;    
        string name;       
    }
   
    struct bidding{
        uint highestBindingBid; 
        address payable highestBidder; 
    }


    /****     CONSTRUCTOR      ***** */
 
   
    constructor() public ERC721("DART", "ART"){
        owner=msg.sender;
    }

    /****     MODIFIERS      ***** */
 
    // check if item exists
    modifier auctionItemExist(uint256 id) {
        require(_auctionItems[id].exists, "Not Found");
        _;
    }
   
    // ensure caller is auction item owner
    modifier onlyNotOwner(uint256 id) {
        AuctionItem memory auctionItem = _auctionItems[id];  
        if (msg.sender == auctionItem.seller) revert();
        _;
    }

    modifier onlyOwner(uint256 id)
    {
        AuctionItem memory auctionItem = _auctionItems[id];  
        if (msg.sender != auctionItem.seller) revert();
         _;
    }
     
    modifier minbid(uint256 id){
        AuctionItem memory auctionItem = _auctionItems[id];
        if(msg.value<auctionItem.minbid) revert();
        _;
    }



    /****     AUCTION ITEM FUNCTIONS      ***** */
 

    function addAuctionItem(uint256 price, string memory tokenURI, uint _bidincrement, uint timePeriod, string memory name) public {
        require(price >= 0, "Price cannot be lesss than 0");

        _auctionItemIds++;
        uint nowTime = now;
        _auctionItems[_auctionItemIds] = AuctionItem(msg.sender, price, tokenURI, true, _bidincrement, nowTime, timePeriod,false,false,name);
        emit LogAddItem(_auctionItemIds, name, msg.sender, price, nowTime, timePeriod);
    }

       
    //get auction item info
    function getAuctionItem(uint256 id)
        public
        view
        auctionItemExist(id)
        returns (uint256, uint256, string memory, uint, uint, uint, bool, string memory, address payable)
    {
        AuctionItem memory auctionItem = _auctionItems[id];
        bidding memory bid = bid[id];
        return (id, auctionItem.minbid, auctionItem.tokenURI, bid.highestBindingBid,auctionItem.time,auctionItem.timePeriod,auctionItem.cancelled,auctionItem.name,auctionItem.seller);
    }
   




    /****     AUCTION FUNCTIONS      ***** */
 
   
    //Cancel auction
    function cancelAuction(uint256 id) 
        public 
        payable 
        returns (bool success)
    {
        AuctionItem storage auctionItem = _auctionItems[id];  
        require(auctionItem.cancelled == false);

        if((auctionItem.time + (auctionItem.timePeriod * 1 seconds) < now)){  
            bidding storage bid = bid[id];
            auctionItem.cancelled = true;
        
            
            if (bid.highestBindingBid != 0 && auctionItem.auctionstarted == true){
                _tokenIds++;
                 
                _safeMint(bid.highestBidder, _tokenIds);
                _setTokenURI(_tokenIds, auctionItem.tokenURI);
                fundsByBidder[id][bid.highestBidder] -= bid.highestBindingBid;

                // send the funds
                (auctionItem.seller).send(bid.highestBindingBid); 
            }

            LogCanceled(id,auctionItem.seller,bid.highestBidder);
        }
        return auctionItem.cancelled;   
    }
   
   function generateSHA256Bytes32(uint256 value, bool fake, uint256 secret)
        public
        view
        returns (bytes32)
    {
        return sha256(abi.encodePacked(value, fake, secret));
    }


    function placeBid(uint256 id) 
        public
        payable
        onlyNotOwner(id)
        minbid(id)
        returns (bool success)
    {  
    
        // reject payments of 0 ETH
        if (msg.value == 0) revert();

        bidding storage bid = bid[id];
        AuctionItem storage auctionItem = _auctionItems[id];  
        require((auctionItem.time + (auctionItem.timePeriod * 1 seconds) > now));
        require(auctionItem.cancelled == false);
        uint newBid = fundsByBidder[id][msg.sender] + msg.value;

        if (newBid <= bid.highestBindingBid) revert();
        uint highestBid = fundsByBidder[id][bid.highestBidder];

        fundsByBidder[id][msg.sender] = newBid;

        if (newBid <= highestBid) {
            
            if(newBid + auctionItem.bidIncrement > highestBid){
                bid.highestBindingBid = highestBid;
            }
            else {
                bid.highestBindingBid = newBid + auctionItem.bidIncrement;
            }
        } else {

            if (msg.sender != bid.highestBidder) {
                bid.highestBidder = msg.sender;

                if(newBid + auctionItem.bidIncrement > highestBid){
                    if(firsttime == false){
                        bid.highestBindingBid = highestBid;
                    }
                    else{
                        bid.highestBindingBid = auctionItem.minbid + auctionItem.bidIncrement;
                        firsttime=true;
                    }
                }
                else{
                    bid.highestBindingBid = newBid + auctionItem.bidIncrement;
                }
            }

            highestBid = newBid;
        }

        if(auctionItem.auctionstarted == false){
            bid.highestBindingBid = msg.value;
        }

        LogBid(msg.sender, id, newBid, bid.highestBidder, highestBid, bid.highestBindingBid);
        auctionItem.auctionstarted = true;
        return true;
    }
   
    function withdraw(uint256 id) 
        public 
        payable 
        onlyNotOwner(id)
        returns (bool success)
    {  
        require(_auctionItems[id].cancelled == true);
        require(_auctionItems[id].auctionstarted == true);
        address payable withdrawalAccount;
        uint withdrawalAmount;
        bidding storage bid = bid[id];
   
        if (msg.sender == bid.highestBidder) {
        
            withdrawalAccount = bid.highestBidder;
            withdrawalAmount = fundsByBidder[id][bid.highestBidder];
        }
        else {
          
            withdrawalAccount = msg.sender;
            withdrawalAmount = fundsByBidder[id][withdrawalAccount];
        }

        if (withdrawalAmount == 0) revert();

        fundsByBidder[id][withdrawalAccount] -= withdrawalAmount;

        // send the funds
        if (!msg.sender.send(withdrawalAmount)) revert();

        LogWithdrawal(id, msg.sender, withdrawalAccount, withdrawalAmount);

        return true;
    }
       
}

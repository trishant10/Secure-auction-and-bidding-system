import { MDBAnimation, MDBBtn, MDBCard, MDBCol, MDBContainer, MDBIcon, MDBInput, MDBRow } from 'mdbreact';
import React, { Component } from 'react';
import Dropzone from 'react-dropzone';
import Validator from '../utils/validator';
import HashHelper from '../utils/hashHelper';
import AuctionAlert from '../components/AuctionAlert';
import LightBox from '../components/LightBox';
import ipfs from '../ipfs.js';
import HelperFunctions from '../utils/Util';
import Spinner from '../components/Spinner';
import AuctionListItem from '../components/AuctionListItem';
import '../styles/sidebar.scss';
import '../styles/drop-file.scss';
import { util } from 'chai';
import TimeAgo from 'javascript-time-ago';
import getWeb3 from "../getWeb3";


class MarketPlaceSell extends Component {
    constructor(props){
        super(props);
        this.state = {
            accounts: this.props.baseAppState.accounts,
            contract: this.props.baseAppState.contract,
            priceContract: this.props.baseAppState.priceFeed,
            file: null,
            buffer: null,
            price: 0,
            increment: 0,
            ONE_MATIC: 0, //USD
            PRICE_TO_USD: 0, //USD
            name: '',
            duration: 0,
            artToView: {},
            ipfsHash: '', //final hash
            ipfsMultiHash: null,
            artHash: [],
            myAuctionedItems: [],
            showFileLightBox: false,
            loading: {
                uploadFile: false,
                addItemBtn: false,
                fetchMyAuctionItems: false
            },
            error: {
                uploadFile: '',
                auctionedItems: '',
                cancelAuction: ''
            },
            success: {
                uploadFile: '',
                auctionedItems: '',
                cancelAuction: ''
            }
        };
        this.fetchMyAuctionItems();
        this.getFileBuffer = this.getFileBuffer.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.openAuction = this.openAuction.bind(this);
        this.cancelAuction = this.cancelAuction.bind(this);       
        this.onFetchMyAuctionItems = this.onFetchMyAuctionItems.bind(this);
    }

    componentDidMount(){
        if(!this.state.accounts){
            this.setState({accounts: localStorage.getItem('accounts')});
        }
        // if(!this.state.contract){
        //     this.setState({contract: localStorage.getItem('contract')});
        // }
        
    }

    componentWillMount= async ()=>{
        const contract = this.state.contract;
        if ( !contract ) {
            let util = new HelperFunctions();
            let response = await util.reloadContractAndAccounts();
            this.setState({ web3: response.web3, accounts: response.accounts, contract: response.contract, priceContract: response.priceFeed });
        }
        this.getMaticPriceFeed();
    }

    componentDidUpdate(){
        
        setInterval(()=>{
            if(!this.state.contract){
                window.location.href='/marketplace/sell';
            }
        }, 5000); 
   
    }

    handleChange = (event)=>{
        event.preventDefault();
        let key = event.target.name;
        let value = event.target.value;
        this.setState({[key]: value});

        if(key === 'price'){
            let USDprice = value * this.state.ONE_MATIC;
            this.setState({PRICE_TO_USD: USDprice});
        }
    }

    getFileBuffer = () =>{
        console.log('file loaded');
        if(this.state.file){            
            var file = this.state.file;
            var reader = new FileReader()  //Convert to a buffer

            reader.readAsArrayBuffer(file); //Parse file
            reader.onload = () => {
                this.convertToBuffer(reader);//Fired after reading operation is completed                            
            }
        }
    }

    //helper function for turning file to buffer
    convertToBuffer = async (reader) => {
        const buffer = Buffer(reader.result);
        this.setState({buffer}, 
            console.log('file buffer', buffer));
        
    };

    resetFileSelection = ()=>{
        this.setState({buffer: null});
        this.setState({file: null});
    }

    onFetchMyAuctionItems = event =>{
        event.preventDefault();
        this.fetchMyAuctionItems();
        event.stopPropagation();
    }

    getMaticPriceFeed = () =>{
        const contract = this.state.priceContract;
        if(!this.state.accounts) return;
        const account = this.state.accounts[0];    

        contract.methods.getLatestPrice().call({from: account})
        .then(result=>{
        
            this.setState({ONE_MATIC: (result/1000000000000000000).toFixed(8)},
                console.log('price feed response', this.state.ONE_MATIC));
        }).catch(error => {
            console.log('getmaticPriceFeed error', error);
        });
    }

    fetchMyAuctionItems = () =>{
        console.log("fetch my auction items method");
        this.setState(prevState => ({
            loading: {
                ...prevState.loading,
                fetchMyAuctionItems: true
        }}));
        const contract = this.state.contract;
        if(!this.state.accounts) return;
        const account = this.state.accounts[0];        

        // get added items through events emitted
        contract.getPastEvents('LogAddItem', {
            filter: {seller: account},  
            fromBlock: 0,
            toBlock: 'latest'
        }, (error, events) => {       
            if (!error){
                console.log('events', events);                
                
                let oldMyAuctionedItems = [];
                events.forEach(event => {
                    let itemId = event.returnValues[0];
                    let name = event.returnValues[1];
                    let seller = event.returnValues[2];
                    let price = event.returnValues[3];
                    let created = event.returnValues[4];
                    let expiry = event.returnValues[5];

                     contract.getPastEvents('LogBid', {
                        filter: {auctionItemId: itemId},  
                        fromBlock: 0,
                        toBlock: 'latest'
                    }, (error, events) => {       
                        if (!error){
                            console.log('events', events); 

                            //pick the last bid on item
                            let lastBid = events[events.length - 1];
                            if(lastBid){
                                let lastBidCurrentHighestBid = lastBid.returnValues[4];
                                if(lastBidCurrentHighestBid){
                                    price = lastBidCurrentHighestBid;
                                }
                            }
                        }}
                    );

                    // check auction status
                    let response = this.getAuctionItem(itemId);
                    response.then(result =>{
                        console.log('get auction ',result);
                        if(result){
                            let isCancelled = result[6];     
                            console.log('item cancel status: '+name, isCancelled);                       
                            if(!isCancelled){
                                oldMyAuctionedItems.push({itemId: itemId, name: name, owner: seller, price: price, created: created, expiry: expiry});
                            }
                        }   
                        this.setState({myAuctionedItems: oldMyAuctionedItems}, console.log('myAuctionedItems: ', this.state.myAuctionedItems));

                    }).catch(error=>{
                        console.log('get auction item for fetchMyAuctionItems error', error);
                    });                         
                });                
            }
            else {
                console.log(error)
            }
            this.setState(prevState => ({
                loading: {
                    ...prevState.loading,
                    fetchMyAuctionItems: false
            }}));
        });
    }

    addAuctionItem(){
        
        let contract = this.state.contract;
        if(typeof contract === 'string' && typeof contract !== 'object' && typeof contract !== null){
            contract = JSON.parse(contract);
        }
        console.log('add item contract', contract);
        const account = this.state.accounts[0];
        console.log('add item account', account);

        let hashHelper = new HashHelper();
        let util = new HelperFunctions();

        let IPFShash = hashHelper.getBytes32FromIpfsHash(this.state.ipfsHash);
        let price = this.state.price;
        let increment = this.state.increment;
        let name = this.state.name;
        let duration = util.ConvertHoursToSeconds(this.state.duration);        

        if(isNaN(price) || isNaN(duration) || isNaN(increment) || !isNaN(name)){
            console.log("invalid input was detected!");
            return null;
        }

        console.log('Auction item details:: ', name, IPFShash, price, increment, duration);

        let response = contract.methods.addAuctionItem(price, IPFShash, increment, duration, name).send({from: account});
        
        response.then(result => {
            console.log('add auction: ', result);
            if(result.status && result.events.LogAddItem){
                let oldMyAuctionedItems = this.state.myAuctionedItems;
                oldMyAuctionedItems.push({name: name, ipfs: this.state.ipfsHash, price: price, increment: increment, created: util.GetUNIXTimeFromDate(Date.now()), expiry: duration});
                this.setState({myAuctionedItems: oldMyAuctionedItems});
                this.setState(prevState => ({
                    success: {
                        ...prevState.success,
                        uploadFile: 'Success — New auction Item was added successfully!'
                }}));
            }else{
                this.setState(prevState => ({
                    error: {
                        ...prevState.error,
                        uploadFile: 'Error — A minor error occured. Take a look at the log'
                }})); 
            }
        }).catch(error=>{
            console.log('add auction item error: ', error);
            this.setState(prevState => ({
                error: {
                    ...prevState.error,
                    uploadFile: error.message
            }})); 
        });         
    }

    resetMessage = () =>{
        let errors = Object.keys(this.state.error);
        for(var propIndex in errors){

            let prop = errors[propIndex];
            console.log(prop);

            this.setState(prevState => ({
                error: {
                    ...prevState.error,
                    [prop]: ''
            }}));
            
 
        }
        
        
    }

    resetInputs = () => {
        this.setState({price: 0});
        this.setState({duration: 0});
        this.setState({increment: 0});
        this.setState({name: ''});
    }

    resetDocumentSelection = ()=>{
        this.setState({buffer: null});
        this.setState({file: null});
    }

    onIPFSSubmit = async(event)=>{
        event.preventDefault();

        this.setState(prevState => ({
            loading: {
                ...prevState.loading,
                addItemBtn: true
        }}));        
        console.log("Submitting file to ipfs");        

        let price = this.state.price;
        let increment = this.state.increment;
        let duration = this.state.duration;
        let name = this.state.name;
        
        if(!this.state.accounts){
            this.setState(prevState => ({
                error: {
                    ...prevState.error,
                    uploadFile: 'Your account is not yet loaded. You may refresh page of it persists.'
            }})); 
            this.setState(prevState => ({
                loading: {
                    ...prevState.loading,
                    addItemBtn: false
            }}));
            return;
        }
        
        if(!increment || !duration || !price || name === ''){
            this.setState(prevState => ({
                error: {
                    ...prevState.error,
                    uploadFile: 'Incomplete Details — All fields are required!'
            }})); 
            this.setState(prevState => ({
                loading: {
                    ...prevState.loading,
                    addItemBtn: false
            }}));
            return;
        }

        // validate data
        let validator = new Validator();

        if(!validator.isValidPrice(price)){
            this.setState(prevState => ({
                error: {
                    ...prevState.error,
                    uploadFile: 'Invalid Price — Minimum auction price must be a number that is not less than 0!'
            }})); 
            this.setState(prevState => ({
                loading: {
                    ...prevState.loading,
                    addItemBtn: false
            }}));
            return;
        }

        if(!validator.isValidIncrement(increment)){
            this.setState(prevState => ({
                error: {
                    ...prevState.error,
                    uploadFile: 'Invalid Increment — Increment must be a number between 0-100!'
            }})); 
            this.setState(prevState => ({
                loading: {
                    ...prevState.loading,
                    addItemBtn: false
            }}));
            return;
        }

        if(!validator.isValidDuration(duration)){
            this.setState(prevState => ({
                error: {
                    ...prevState.error,
                    uploadFile: 'Invalid Duration — Auction duration (in hours) must be a number between 1-168!'
            }})); 
            this.setState(prevState => ({
                loading: {
                    ...prevState.loading,
                    addItemBtn: false
            }}));
            return;
        }

        if(!validator.isValidName(name)){
            this.setState(prevState => ({
                error: {
                    ...prevState.error,
                    uploadFile: 'Invalid Name — auction name cannot be a number!'
            }})); 
            this.setState(prevState => ({
                loading: {
                    ...prevState.loading,
                    addItemBtn: false
            }}));
            return;
        }

        this.setState(prevState => ({
            loading: {
                ...prevState.loading,
                uploadFile: true
        }}));        

        if(!this.state.file){
            this.setState(prevState => ({
                error: {
                    ...prevState.error,
                    uploadFile: 'Invalid File Selection — Please re-select your auction file'
            }})); 
        }
        const bufferData = this.state.buffer;
        console.log('bufferData', bufferData);
        if(bufferData){
            ipfs.add(bufferData)
            .then((ipfsHash) => {
                console.log(ipfsHash);
                this.setState({ipfsHash: ipfsHash.path});
                this.setState({ipfsMultiHash: ipfsHash.cid.multihash});
                
                this.setState(prevState => ({
                    loading: {
                        ...prevState.loading,
                        uploadFile: false
                }}), this.resetDocumentSelection());

                this.addAuctionItem();
              
                this.resetInputs();
                console.log('complete ipfs upload');                
            })
            .catch(err => {
                console.log(err);
                this.setState(prevState => ({
                    error: {
                        ...prevState.error,
                        uploadFile: 'Error occured while uploading auction to IPFS. Check your connection or Reload the page and try again.'
                }})); 
            })
            this.setState(prevState => ({
                loading: {
                    ...prevState.loading,
                    addItemBtn: false
            }}));
        }else{
            console.log('no file was selected. reload page and re-select file');
            
            this.setState(prevState => ({
                error: {
                    ...prevState.error,
                    uploadFile: 'Invalid File Selection — Please re-select your auction file'
            }})); 
            
            this.setState(prevState => ({
                loading: {
                    ...prevState.loading,
                    uploadFile: false
            }}), this.resetDocumentSelection());
            this.setState(prevState => ({
                loading: {
                    ...prevState.loading,
                    addItemBtn: false
            }}));
            return;
        }        
    };

    getAuctionItem = (itemId)=>{
        console.log("get bid method");
        const contract = this.state.contract;
        if(!this.state.accounts) return;
        const account = this.state.accounts[0];    
        console.log('open auction item');
        console.log('contract', contract);
        console.log('accout', account);
        console.log(itemId);
        return contract.methods.getAuctionItem(itemId).call({from: account});
    }

    OnCloseLightBox = () => {
        this.setState({showFileLightBox: false});
    }

    openAuction=(itemId, ipfsHash, name)=> event=>{
        let hashHelper = new HashHelper();
        event.stopPropagation();

        console.log('open auction details', ipfsHash, name);

        if(ipfsHash && name){// just added auction
            console.log('open new added auction');
            console.log(ipfsHash, name);
            let ref = hashHelper.getIpfsHashFromBytes32(ipfsHash);
            this.setState({artToView: {ipfsHash: ref, name: name}}, this.setState({showFileLightBox: true}));

        }else{//fetched auction

            let response = this.getAuctionItem(itemId);
            response.then(result =>{
                console.log('get auction ',result);
                if(result){
                    let auctionName = result[7];
                    let artIPFShash = result[2];

                    let ref = hashHelper.getIpfsHashFromBytes32(artIPFShash);

                    this.setState({artToView: {ipfsHash: ref, name: auctionName}}, this.setState({showFileLightBox: true}));
                }
            }).catch(error=>{
                console.log(error);
            });
        }
                        
    }

    cancelAuction =(itemId) => event=>{
        event.preventDefault();
        let contract = this.state.contract;
        if(typeof contract === 'string' && typeof contract !== 'object' && typeof contract !== null){
            contract = JSON.parse(contract);
        }
        console.log('cancel auction contract', contract);
        const account = this.state.accounts[0];
        console.log('cancel auction account', account);

        let response = contract.methods.cancelAuction(itemId).send({from: account});
        
        response.then(result => {
            console.log('cancel auction: ', result);
            if(result.status && result.events.LogCanceled){
                this.setState(prevState => ({
                    success: {
                        ...prevState.success,
                        cancelAuction: 'Success — Auction was successfully canceled!'
                }}));

                //remove from UI
                let itemIndex = this.state.myAuctionedItems.findIndex(item => item.itemId === itemId);
                if(itemIndex > -1){
                    let myAuctions = this.state.myAuctionedItems;
                    myAuctions.splice(itemIndex, 1);
                    this.setState({myAuctionedItems: myAuctions});
                }

            }else{
                this.setState(prevState => ({
                    error: {
                        ...prevState.error,
                        cancelAuction: 'Error — A minor error occured. Take a look at the log'
                }})); 
            }
        }).catch(error=>{
            console.log('cancel auction error: ', error);
            this.setState(prevState => ({
                error: {
                    ...prevState.error,
                    cancelAuction: error.message
            }})); 
        });
        event.stopPropagation();
    }

    render() {
        let util = new HelperFunctions();
        const timeAgo = new TimeAgo('en-US');
        
        return (            
            <div>
                {this.state.showFileLightBox ? 
                    <LightBox toView={this.state.artToView} closeLightBoxCallback={this.OnCloseLightBox} />: null
                    }
                <MDBContainer className="page-container">                
                <MDBRow>
                    <MDBCol md="3">
                        <div className={`drop-file ${this.state.file ? "file-loaded" : ""}`}>
                            <MDBAnimation type="bounce-in">                                
                                <Dropzone onDrop={acceptedFiles => this.setState({file: acceptedFiles[0]}, this.getFileBuffer)}>
                                    {({getRootProps, getInputProps}) => (                                
                                        <MDBCard {...getRootProps()}>
                                            <section className="m-3">
                                                <input {...getInputProps()} />
                                                <MDBIcon icon="cloud-upload-alt" size="4x" />
                                                <p className="">{this.state.file ? "File loaded. Fill the Auction Information" : <span>Click here to select your auction image</span>}</p>
                                            </section>
                                        </MDBCard>                                
                                    )}
                                </Dropzone>
                                
                            </MDBAnimation>                     
                        </div>
                    </MDBCol>
                    <MDBCol md='6' className="px-4">
                        <form>
                            <h1>Auction Dashboard</h1>
                            <hr />
                            <h6><b>Auction Item Details</b></h6>
                            <MDBRow>
                                {this.state.error.uploadFile ? 
                                    <AuctionAlert onCloseCallback={this.resetMessage} type="danger" message={this.state.error.uploadFile} />                                        
                                :null}
                                {this.state.success.uploadFile ? 
                                <AuctionAlert onCloseCallback={this.resetMessage} type="success" message={this.state.success.uploadFile} />                                        
                                :null}      
                                {this.state.error.cancelAuction ? 
                                    <AuctionAlert onCloseCallback={this.resetMessage} type="danger" message={this.state.error.cancelAuction} />                                        
                                :null}
                                {this.state.success.cancelAuction ? 
                                <AuctionAlert onCloseCallback={this.resetMessage} type="success" message={this.state.success.cancelAuction} />                                        
                                :null}  
                                <MDBCol md='6'>
                                    <label htmlFor="name" className="grey-text mt-2">
                                        Name
                                    </label>
                                    <input type="text" value={this.state.name} onChange={this.handleChange} id="name" name="name" className="form-control" />
                                </MDBCol>                          
                              
                                
                            </MDBRow>
                            <MDBRow>
                            <MDBCol md='6'>
                                    <label htmlFor="minPrice" className="grey-text mt-2">
                                        Auction Item Price
                                    </label>                    
                                    <input type="number" value={this.state.price} min={0} onChange={this.handleChange} id="minPrice" name="price" className="form-control" />
                                </MDBCol>
                            </MDBRow>
                            <MDBRow>
                                <MDBCol md='6'>
                                    <label htmlFor="increment" className="grey-text mt-2">
                                        Increment (1-100)
                                    </label>
                                    <input type="number" value={this.state.increment} min={0} onChange={this.handleChange} id="increment" name="increment" className="form-control" />
                                </MDBCol>                
                            </MDBRow>
                            <MDBRow>
                            <MDBCol md='6'>
                                    <label htmlFor="duration" className="grey-text mt-2">
                                        Auction Duration (In hours:: 0-72)
                                    </label>
                                    <input type="number" value={this.state.duration} min={0} onChange={this.handleChange} id="duration" name="duration" className="form-control" />
                                </MDBCol>
                            </MDBRow>                            
                            <MDBRow>
                                <MDBContainer className="mt-3">
                                    <MDBBtn onClick={this.onIPFSSubmit} block color="green" >{this.state.loading.addItemBtn || this.state.loading.uploadFile ? <Spinner size="small"/> : <span>Add Auction Item</span> }</MDBBtn>
                                </MDBContainer>
                            </MDBRow>
                        </form>
                    </MDBCol>
                    <MDBCol md='3' style={{marginTop: '0px'}}>
                        <h4>My Auctioned Items</h4>
                        <hr />
                        <div className="art-side-bar-wrapper pr-2">
                            {this.state.myAuctionedItems && this.state.myAuctionedItems.length > 0 ?
                                this.state.myAuctionedItems.map((item, index) => {
                                    return (
                                        <>
                                            <span className="cancel-auction-btn" onClick={this.cancelAuction(item.itemId)}>CANCEL</span>
                                            <span onClick={this.openAuction(item.itemId, item.ipfs, item.name)}>
                                                <AuctionListItem
                                                    key={index}
                                                    auctionTitle={item.name} 
                                                    currentHighestBid={item.price} 
                                                    timeLeft={timeAgo.format(util.GetDateFromUNIXTime(Number(item.created) + Number(item.expiry)), 'twitter')} 
                                                                                           
                                                />
                                            </span>
                                        </>
                                    )
                                })
                            : 
                            <>
                                <h6>You currently have no auctioned items</h6>
                                <MDBBtn onClick={this.onFetchMyAuctionItems} block color="green" >{this.state.loading.fetchMyAuctionItems ? <Spinner size="small"/> : <span>Manually Fetch Auction Items</span> }</MDBBtn>
                            </>}
                        </div>
                    </MDBCol>
                </MDBRow>               
            </MDBContainer>
        
            </div>    
        );
    }
}

export default MarketPlaceSell;
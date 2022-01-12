import React, { Component } from 'react';
import FsLightbox from 'fslightbox-react';
import AuctionView from './AuctionView';

class LightBox extends Component {
    constructor(props){
        super(props);
        this.state = {
            toggler: false,
            files: [],
            groupFilesSources: [],
            key: 0,
            shouldOpenOnMount: true
        }
    }

    setToggler=()=>{
        this.setState({toggler: !this.state.toggler});
    }

    
    remountLightbox() {
        this.setState({
            shouldOpenOnMount: true
        }, this.setState({
            key: this.state.key + 1
        }));        
    }

    componentDidMount(){
        this.setToggler();        
        this.remountLightbox();
    }

    componentWillMount(){        
        //INDIVIDUAL FILES (NOT GROUPS)
        let newSources = 
                <div style={{width:'100%'}}>
                    <AuctionView url={'https://ipfs.infura.io/ipfs/'+ this.props.toView.ipfsHash} artName={this.props.toView.name}>
                        {this.props.children}
                    </AuctionView>
                </div>
            ;
        this.setState({groupFilesSources: [newSources]});                  
    }

    closeLightBox(){
        this.props.closeLightBoxCallback();
    }

    render() {
        
        return (
            <div className="light-box-container">
                
                {console.log('sources to fetch from',this.state.groupFilesSources),
                console.log('component toggler', this.state.toggler)}
                {this.state.groupFilesSources.length > 0 ? 
                    <FsLightbox
                        toggler={this.state.toggler}            
                        onClose={ () => this.closeLightBox()}
                        sources={this.state.groupFilesSources}
                        key={this.state.key}
                        openOnMount={this.state.shouldOpenOnMount}
                        
                    />:
                    <FsLightbox
                        toggler={this.state.toggler}            
                        onClose={ () => this.closeLightBox()}
                        sources={[
                            <div style={{width:'100%'}}>
                                <h3>Auction file is not available!</h3>
                            </div>
                        ]}
                        key={this.state.key}
                    />
                }   
            </div>
        );
    }
}

export default LightBox;
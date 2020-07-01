import React from 'react';
import { TouchableOpacity, FlatList, StyleSheet, Text, View, Image} from 'react-native';
import { f, auth, database, storage } from '../../config/config.js';

console.disableYellowBox = true;

class PhotoList extends React.Component{

  constructor(props){
    super(props);
    this.state = {
      photo_feed: [],
      refresh: false,
      loading: true,
      empty: false,
      startKey: ''
    }
  }

  componentDidMount = () => {

    const { isUser, userId} = this.props;

    if(isUser == true){
      //Profile
      //userid
      this.loadFeed(userId);
    }else{
      this.loadFeed('');
    }
  }

  pluralCheck = (s) => {

    if(s == 1){
      return ' ago';
    }else{
      return 's ago';
    }
  }

  timeConverter = (timestamp) => {

    var a = new Date(timestamp * 1000);
    var seconds = Math.floor((new Date() - a) / 1000);

    var interval = Math.floor(seconds / 31536000);
    if(interval >= 1){
      return interval+ ' year'+this.pluralCheck(interval);
    }
    interval = Math.floor(seconds / 2592000);
    if(interval >= 1){
      return interval+ ' month'+this.pluralCheck(interval);
    }
    interval = Math.floor(seconds / 86400);
    if(interval >= 1){
      return interval+ ' day'+this.pluralCheck(interval);
    }
    interval = Math.floor(seconds / 3600);
    if(interval >= 1){
      return interval+ ' hour'+this.pluralCheck(interval);
    }
    interval = Math.floor(seconds / 60);
    if(interval >= 1){
      return interval+ ' minute'+this.pluralCheck(interval);
    }
    return Math.floor(seconds)+ ' second'+this.pluralCheck(seconds);


  }

  addToFlatList = (photo_feed, data, photo) => {
    var that = this;
    var photoObj = data[photo];
    database.ref('users').child(photoObj.author).child('username').once('value').then(function(snapshot) {
          const exists = (snapshot.val() !== null);
          if(exists) data = snapshot.val();
            photo_feed.push({
              id: photo,
              url: photoObj.url,
              caption: photoObj.caption,
              posted: that.timeConverter(photoObj.posted),
              timestamp: photoObj.posted,
              author: data,
              authorId: photoObj.author
            });

            console.log({
              id: photo,
              url: photoObj.url,
              caption: photoObj.caption,
              posted: that.timeConverter(photoObj.posted),
              timestamp: photoObj.posted,
              author: data,
              authorId: photoObj.author
            })

            var myData = [].concat(photo_feed).sort((a,b) => a.timestamp < b.timestamp);

            //Ensure unique
            myData = myData.filter((thing, index, self) =>
              index === self.findIndex((t) => (
                t.id === thing.id && t.url === thing.url
              ))
            );

            that.setState({
              refresh: false,
              loading: false,
              photo_feed: myData
            });

      }).catch(error => console.log(error));
  }


  handleLoadMore = () => {
    //Fetch new
    console.log('load more');
    startKey = this.state.startKey;
    this.runLoadMore(1, startKey);
  }

  runLoadMore = (perPage, startKey = '') => {
    //Fetch new
    console.log('load more', perPage, startKey);
    var that = this;

    //Fetch most recent
    var fetchRecords = database.ref('photos').orderByChild('posted').limitToLast(perPage+1+that.state.startKey);
    fetchRecords.once('value').then(function(snapshot) {
      const exists = (snapshot.val() !== null);
      if(exists){

        data = snapshot.val();
        var photo_feed = that.state.photo_feed;

        that.setState({empty: false});
        var count = 1;
        for(var photo in data){
          if(count == snapshot.numChildren()){
            console.log('new start key: '+photo);
            that.setState({startKey: that.state.startKey+count});
          }

          console.log('add to list...');
          that.addToFlatList(photo_feed, data, photo);


          count++;
        }
      }else{
        that.setState({empty: true});
      }
    }).catch(error => console.log(error));
  };


  loadFeed = (userId = '') => {

    var perPage = 1;

    this.setState({
      refresh:true,
      photo_feed: []
    });

    var that = this;

    var loadRef = database.ref('photos');
    if(userId != ''){
      loadRef = database.ref('users').child(userId).child('photos');
    }

    loadRef.orderByChild('posted').limitToLast(perPage+1).once('value').then(function(snapshot) {
      const exists = (snapshot.val() !== null);
      if(exists){ data = snapshot.val();
        var photo_feed = that.state.photo_feed;

        that.setState({empty: false});
        var count = 1;
        for(var photo in data){
          if(count == snapshot.numChildren()){
            that.setState({startKey: count});
          }

          that.addToFlatList(photo_feed, data, photo);

          count++;
        }
      }else{
        that.setState({empty: true});
      }
    }).catch(error => console.log(error));

  }

  loadNew = () => {

      //Load Feed
      this.loadFeed();
  }

  render()
  {
    return(
      <View style={{flex: 1}}>
        { this.state.loading == true ? (
          <View style={{flex:1, justifyContent: 'center', alignItems: 'center'}}>
            { this.state.empty == true ? (
              <Text>No photos found...</Text>
            ): (
              <Text>Loading...</Text>
            )}
          </View>
        ) : (
        <FlatList
          refreshing={this.state.refresh}
          onRefresh={this.loadNew}
          data={this.state.photo_feed}
          keyExtractor={(item, index) => index.toString()}
          style={{flex:1, backgroundColor:'#eee'}}
          renderItem={({item, index}) => (
            <View key={index} style={{width: '100%', overflow:'hidden', marginBottom: 5, justifyContent:'space-between', borderBottomWidth:1, borderColor: 'grey'}}>
              <View style={{padding:5, width:'100%', flexDirection: 'row', justifyContent: 'space-between'}}>
                <Text>{item.posted}</Text>
                <TouchableOpacity
                onPress={ () => this.props.navigation.navigate('User', {userId: item.authorId})}>
                  <Text>{item.author}</Text>
                </TouchableOpacity>
              </View>
              <View>
                <Image
                  source={{uri: item.url }}
                  style={{resizeMode: 'cover', width: '100%', height: 500}}
                  />
              </View>
              <View style={{padding:5}}>
                <Text>{item.caption}</Text>
                <TouchableOpacity
                onPress={ () => this.props.navigation.navigate('Comments', {photoId: item.id})}>
                  <Text style={{color: 'blue', marginTop: 10, textAlign:'center'}}>[ View Comments ]</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          onEndReached={this.handleLoadMore}
          onEndThreshold={0}
          />
        )}
      </View>
    )
  }


}

export default PhotoList;

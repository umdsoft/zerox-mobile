import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import {normalize, style} from '../../theme/style';
import {useNavigation} from '@react-navigation/native';
const data = [
  {
    id: 1,
    title: 'Zeroxdagi uzgarishlar haqida',
    desc: 'Zeroxdagi uzgarishlar haqida batafsil maqola',
    img: 'https://w7.pngwing.com/pngs/340/946/png-transparent-avatar-user-computer-icons-software-developer-avatar-child-face-heroes.png',
  },
  {
    id: 2,
    title: 'Zeroxdagi uzgarishlar haqida',
    desc: 'Zeroxdagi uzgarishlar haqida batafsil maqola',
    img: 'https://w7.pngwing.com/pngs/340/946/png-transparent-avatar-user-computer-icons-software-developer-avatar-child-face-heroes.png',
  },
  {
    id: 3,
    title: 'Zeroxdagi uzgarishlar haqida',
    desc: 'Zeroxdagi uzgarishlar haqida batafsil maqola',
    img: 'https://w7.pngwing.com/pngs/340/946/png-transparent-avatar-user-computer-icons-software-developer-avatar-child-face-heroes.png',
  },
];
const Slider = () => {
  const scrollRef = useRef(null);
  const navigation = useNavigation();
  const scrollX = new Animated.Value(0);
  let position = Animated.divide(scrollX, normalize(170));

  const RenderList = ({item, index}) => {
    return (
      <Pressable
        onPress={() => {
          navigation.navigate('AboutUs');
        }}
        style={{width: '100%', height: normalize(170)}}
      >
        <View style={{flexDirection: 'row'}}>
          <View style={{maxWidth: '70%'}}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc}>{item.desc}</Text>
          </View>
          <View>
            <Image
              source={{uri: item.img}}
              style={styles.image}
              resizeMode="cover"
            />
          </View>
        </View>
      </Pressable>
    );
  };
  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        onScroll={Animated.event(
          [{nativeEvent: {contentOffset: {y: scrollX}}}],
          {useNativeDriver: false},
        )}
      >
        {data.map((item, index) => {
          return (
            <RenderList item={item} index={index} key={index.toString()} />
          );
        })}
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          alignSelf: 'flex-end',
          top: 0,
          bottom: 0,
          right: 0,
          justifyContent: 'center',
        }}
      >
        {data.map((_, i) => {
          let opacity = position.interpolate({
            inputRange: [i - 1, i, i + 1],
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={i.toString()}
              style={{
                opacity,
                height: 8,
                width: 8,
                backgroundColor: style.blue,
                margin: 5,
                borderRadius: 20,
              }}
            />
          );
        })}
      </View>
    </View>
  );
};

export default Slider;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 10,
  },
  image: {
    width: 80,
    height: 80,
  },
  title: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx,
    color: style.textColor,
  },
  desc: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.small,
    color: style.textColor,
  },
});

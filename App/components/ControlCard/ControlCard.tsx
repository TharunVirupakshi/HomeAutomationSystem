import { COLORS, FONTS } from '@/constants';
import { Entypo } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import React, { useEffect, useState } from 'react';
import { Pressable, TextStyle, TouchableOpacity } from 'react-native';
import { ViewStyle } from 'react-native';
import { View, Text, StyleSheet } from 'react-native';
import PressableWithOpacity from '../common/PressableWithOpacity';


interface ControlCardProps {
  title: string;
  subtitle: string;
  status: "on" | "off";
  onPowerBtnPress: () => void;
  deviceStatus: string;
  icon: React.ReactNode;
  customStyles?: {
    cardStyle?: ViewStyle;
    titleStyle?: TextStyle;
    subtitleStyle?: TextStyle;
  };

}

const CardWithIcon: React.FC<ControlCardProps> = ({
  title,
  subtitle,
  status,
  icon,
  onPowerBtnPress,
  deviceStatus,
  customStyles = {}
}) => {

    const [isOn, setIsOn] = useState(false)

    useEffect(() => {
      if(status === "on") setIsOn(true)
      else                setIsOn(false)
    }, [status])
   
  
    const handleOnPress = () => {
      setIsOn( prev => !prev)
      onPowerBtnPress();
      if(deviceStatus === 'OFFLINE'){
        setTimeout(()=> setIsOn(false), 2000)
      } 
    }
    

  return (
    <View style={[styles.card, customStyles.cardStyle]}>
      <View style={styles.textContainer}>
        <Text
          style={[styles.title, customStyles.titleStyle]}
          numberOfLines={2}
          ellipsizeMode="middle"
        >
          {title}
        </Text>
      
        <Text style={[styles.subtitle, customStyles.subtitleStyle]}>
          {subtitle}
        </Text>
      </View>

      <View
        style={{
          flexDirection: "row",
        //   borderColor: "white",
        //   borderWidth: 0.5,
          justifyContent: "space-between"
        }}
      >
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            // borderColor: "white",
            // borderWidth: 0.5,
            alignItems: "flex-end",
          }}
        >
          
          <Pressable hitSlop={20} onPress={handleOnPress}>
           <Feather name="power" size={23} color={isOn ? "lightgreen" : "grey"} />
           </Pressable>  
        </View>
          <View style={styles.iconInnerContainer}>{icon}</View>
      </View>
    </View>
  );
};

export default CardWithIcon;

const styles = StyleSheet.create({
  textContainer: {
    // flex: 1, 
    flexWrap: "wrap",
    // flexShrink: 1,s
    
    // marginRight: 5,
    // borderColor: "white",
    // borderWidth: 0.5
    },
    titleContainer:{
      flex: 1, 
      flexDirection: "row",
      justifyContent: "space-between",
      // borderColor: "white",
      // borderWidth: 0.5
    },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 15,
    display: "flex",
    // flexDirection: 'row',
    justifyContent: 'space-between',
    // alignItems: 'center',
    width: "100%"
  },
  title: {
    color: COLORS.text,
    fontSize: FONTS.size.medium,
    includeFontPadding: false,
    fontFamily: FONTS.medium,
    flexShrink: 2,
    width: "100%"
  },
  subtitle: {
    color: COLORS.textLight,
    fontSize: FONTS.size.small,
    fontFamily: FONTS.regular,
    includeFontPadding: false
  },
  iconContainer: {
    // flex: 0.5,
    // width: 40, 
    // aspectRatio: 1,
    // display: "flex",
    // flexDirection: "row",
    // alignItems: "flex-end",
    borderColor: "white",
    borderWidth: 0.5,
    // padding: 3,
    // marginLeft: 2
    // justifyContent: "center"
  },
  iconInnerContainer:{
    // padding: 1,
    // borderColor: "white",
    // borderWidth: 0.5
  }
});

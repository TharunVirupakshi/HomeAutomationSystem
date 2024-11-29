import { COLORS, FONTS } from '@/constants';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import React from 'react';
import { TextStyle } from 'react-native';
import { ViewStyle } from 'react-native';
import { View, Text, StyleSheet } from 'react-native';
import PressableBtn from './PressableBtn';

interface CardWithIconProps {
  title: string;
  subtitle: string;
  btnText?: string;
  icon: React.ReactNode,
  customStyles?: {
    cardStyle?: ViewStyle;
    titleStyle?: TextStyle;
    subtitleStyle?: TextStyle;
  };
}

const CardWithIcon: React.FC<CardWithIconProps> = ({
  title,
  subtitle,
  btnText,
  icon,
  customStyles = {}
}) => {
  return (
    <View style={[styles.card, customStyles.cardStyle]}>
      <View style={styles.textContainer}
        >
        <Text style={[styles.title, customStyles.titleStyle]} numberOfLines={1} ellipsizeMode='middle'>{title}</Text>
        <Text style={[styles.subtitle, customStyles.subtitleStyle]}>{subtitle}</Text>

        {btnText && 
        <PressableBtn
          customStyles={{
            button: {
              marginTop: 10,
            },
            text: {
              fontFamily: FONTS.medium,
              includeFontPadding: false,
            },
          }}
          btnText={btnText}
        />}
        
      </View>
      <View style={styles.iconContainer}>
        <View style={styles.iconInnerContainer}>
            {icon}
        </View>
      </View>
    </View>
  );
};

export default CardWithIcon;

const styles = StyleSheet.create({
  textContainer: {
    flex: 1, 
    flexWrap: "wrap",
    flexShrink: 1,
    // marginRight: 5,
    // borderColor: "white",
    // borderWidth: 0.5
    },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: COLORS.text,
    fontSize: FONTS.size.extraLarge,
    fontFamily: FONTS.medium,
    flexShrink: 2,
    width: "100%"
  },
  subtitle: {
    color: COLORS.textLight,
    fontSize: FONTS.size.small,
    fontFamily: FONTS.regular,
  },
  iconContainer: {
    // flex: 0.5,
    width: 50, 
    aspectRatio: 1,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    // borderColor: "white",
    // borderWidth: 0.5,
    padding: 3,
    marginLeft: 2
  },
  iconInnerContainer:{
    padding: 1,
    // borderColor: "white",
    // borderWidth: 0.5
  }
});

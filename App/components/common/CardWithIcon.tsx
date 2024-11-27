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
      <View style={{flex: 1, flexWrap: "wrap"}}>
        <Text style={[styles.title, customStyles.titleStyle]}>{title}</Text>
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
        {icon}
      </View>
    </View>
  );
};

export default CardWithIcon;

const styles = StyleSheet.create({
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
    flexWrap: "wrap"
  },
  subtitle: {
    color: COLORS.textLight,
    fontSize: FONTS.size.small,
    fontFamily: FONTS.regular,
  },
  iconContainer: {
    // borderColor: "white",
    // borderWidth: 0.5,
    padding: 15,
  },
});

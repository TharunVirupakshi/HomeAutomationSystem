import React from "react";
import { Animated, Pressable, Text} from "react-native";
import { TextStyle, ViewStyle, StyleProp} from "react-native/types";

type CustomStyles = {
    button?: StyleProp<ViewStyle>; // For the button view
    text?: StyleProp<TextStyle>;   // For the text
  };

interface PressableBtnProps {
customStyles: CustomStyles;
btnText: string 
}
export default function PressableBtn({customStyles, btnText} : PressableBtnProps){
    const animated = new Animated.Value(1);

    const fadeIn = () => {
      Animated.timing(animated, {
        toValue: 0.4,
        duration: 100,
        useNativeDriver: true,
      }).start();
    };
    const fadeOut = () => {
      Animated.timing(animated, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    };

    return(
        <Pressable onPressIn={fadeIn} onPressOut={fadeOut}>
      <Animated.View
          style={[{
            opacity: animated,
            backgroundColor: "white",
            padding: 7,
            width: 100,
            borderRadius: 100
          }, customStyles.button]}
        >
        <Text style={[{textAlign: 'center'} ,customStyles.text]}>{btnText}</Text>
        </Animated.View>
        </Pressable>
        
    )
}
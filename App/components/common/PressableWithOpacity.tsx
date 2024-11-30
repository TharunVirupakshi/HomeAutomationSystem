import React, { ReactNode } from "react";
import { ViewStyle } from "react-native";
import { PressableProps, StyleProp } from "react-native";
import { Animated, Pressable} from "react-native";
import { GestureHandlerGestureEvent } from "react-native-gesture-handler";




interface PressableWithOpacityProps{
    children: ReactNode,
    containerStyle?: StyleProp<ViewStyle>,
    pressableStyle?: StyleProp<ViewStyle>,
    onPress?: () => void 
}

export default function PressableWithOpacity({children, onPress, containerStyle, pressableStyle} : PressableWithOpacityProps){
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

    return (
        <Animated.View
          style={[{
            opacity: animated
          },containerStyle]}
        >
      <Pressable onPress={onPress} onPressIn={fadeIn} onPressOut={fadeOut} style={pressableStyle}>
          {children}
      </Pressable>
        </Animated.View>
    );
}
import React, { ReactNode } from "react";
import { Animated, Pressable} from "react-native";

interface PressableWithOpacityProps{
    children: ReactNode
}

export default function PressableWithOpacity({children} : PressableWithOpacityProps){
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
      <Pressable onPressIn={fadeIn} onPressOut={fadeOut}>
        <Animated.View
          style={{
            opacity: animated,
          }}
        >
          {children}
        </Animated.View>
      </Pressable>
    );
}
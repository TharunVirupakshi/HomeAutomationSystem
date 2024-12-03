import React from "react";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

// Define available icons
const ICON_MAP: Record<string, (props: any) => JSX.Element> = {
  TableLamp: (props) => <MaterialCommunityIcons name="lamp-outline" {...props} />,
  CeilingLight: (props) => <FontAwesome5 name="lightbulb" {...props} />,
  Fan: (props) => <FontAwesome6 name="fan" {...props} />,
  Oven: (props) => <MaterialCommunityIcons name="toaster-oven" {...props} />,
  Refrigerator: (props) => <MaterialIcons name="kitchen" {...props} />,
  TV: (props) => <MaterialCommunityIcons name="television" {...props} />,
  Home: (props) => <FontAwesome5 name="home" {...props} />,
  Kitchen: (props) => <FontAwesome6 name="kitchen-set" {...props} />,
  Bedroom: (props) => <FontAwesome5 name="bed" {...props} />,
  Bathroom: (props) => <FontAwesome6 name="bath" {...props} />,
};

interface IconProps {
  iconName: string;
  size?: number;
  color?: string;
}

// Icon Component
const Icon: React.FC<IconProps> = ({ iconName, size = 24, color = "white" }) => {
  const IconComponent = ICON_MAP[iconName];

  if (!IconComponent) {
    console.warn(`Icon "${iconName}" not found. Using default icon.`);
    return <FontAwesome5 name="question-circle" size={size} color={color} />;
  }

  return <IconComponent size={size} color={color} />;
};

export default Icon;

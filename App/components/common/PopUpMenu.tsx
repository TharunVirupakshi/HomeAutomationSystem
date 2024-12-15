import { COLORS, FONTS } from '@/constants';
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from 'react-native';

// Define interfaces for props
interface MenuOption {
  label: string;
  onPress: () => void;
}

interface PopUpMenuProps {
  isMenuVisible: boolean;
  toggleMenu: () => void;
  menuOptions: MenuOption[];
}

// Component
const PopUpMenu: React.FC<PopUpMenuProps> = ({
  isMenuVisible,
  toggleMenu,
  menuOptions,
}) => {
  return (
    <Modal
      visible={isMenuVisible}
      transparent
      animationType="fade"
      onRequestClose={toggleMenu}
      style={{backgroundColor: 'transparent'}}
    >
      {/* Overlay to close the menu */}
      <Pressable style={styles.overlay} onPress={toggleMenu}>
        <View style={styles.popupMenu}>
          {/* Render menu options dynamically */}
          {menuOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => {
                toggleMenu(); // Close menu before action
                option.onPress();
              }}
            >
              <Text style={styles.menuItemText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
};

export default PopUpMenu;

// Styles
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    // borderColor: "white",
    // borderWidth: 0.5,
    height: '100%'
  },
  popupMenu: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    elevation: 5,
    // borderColor: "grey",
    // borderWidth: 0.5,
    margin: 10
  },
  menuItem: {
    paddingVertical: 10
  },
  menuItemText: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.size.medium,
    color: COLORS.text,
  },
});

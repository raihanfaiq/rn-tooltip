//  @flow

import * as React from 'react';
import {
  TouchableOpacity,
  Modal,
  View,
  I18nManager,
} from 'react-native';
import PropTypes from 'prop-types';
import { ViewPropTypes as RNViewPropTypes } from 'deprecated-react-native-prop-types';

import Triangle from './Triangle';
import {
  ScreenWidth,
  ScreenHeight,
  isIOS,
  ActualScreenHeight,
} from './helpers';
import getTooltipCoordinate from './getTooltipCoordinate';
import Svg, { Rect } from 'react-native-svg';

const IconClose = (props: any) => {
  const { fill = '#000' } = props;

  return (
    <Svg
      width={12}
      height={12}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Rect
        x={0.54}
        width={16.044}
        height={0.764}
        rx={0.382}
        transform="rotate(45 .54 0)"
        fill={fill}
      />
      <Rect
        x={12}
        y={0.54}
        width={16.044}
        height={0.764}
        rx={0.382}
        transform="rotate(135 12 .54)"
        fill={fill}
      />
    </Svg>
  );
};

const ViewPropTypes = RNViewPropTypes || View.propTypes;

type State = {
  isVisible: boolean,
  yOffset: number,
  xOffset: number,
  elementWidth: number,
  elementHeight: number,
  elementPopoverHeight: number,
  elementPopoverYOffset: number,
};

type Props = {
  withPointer: boolean,
  popover: React.Element,
  withCloseIcon: boolean,
  closeIconRender: React.Element,
  closeIconColor: string,
  closeIconBackgroundColor: string,
  height: number | string,
  width: number | string,
  containerStyle: any,
  pointerColor: string,
  pointerStyle: {},
  onClose: () => void,
  onOpen: () => void,
  withOverlay: boolean,
  closeOnOverlay: boolean,
  closeOnPopover: boolean,
  onRequestClose: boolean,
  tooltipOffset: number,
  mainPadding: number,
  mainBorderRadius: number,
  overlayColor: string,
  backgroundColor: string,
  highlightColor: string,
  toggleWrapperProps: {},
  actionType: 'press' | 'longPress' | 'none',
  position: string,
};

class Tooltip extends React.Component<Props, State> {
  state = {
    isVisible: false,
    yOffset: 0,
    xOffset: 0,
    elementWidth: 0,
    elementHeight: 0,
    elementPopoverHeight: 0,
    elementPopoverYOffset: 0,
  };

  renderedElement;
  timeout;

  toggleTooltip = () => {
    const { onClose, onOpen } = this.props;

    this.setState(prevState => {
      if (prevState.isVisible && !isIOS) {
        onClose && onClose();
      }
      if (!prevState.isVisible) {
        onOpen && onOpen();
      }

      this.getElementPosition();

      return { isVisible: !prevState.isVisible };
    });
  };

  wrapWithAction = (actionType, children) => {
    switch (actionType) {
      case 'press':
        return (
          <TouchableOpacity
            onPress={this.toggleTooltip}
            activeOpacity={1}
            {...this.props.toggleWrapperProps}
          >
            {children}
          </TouchableOpacity>
        );
      case 'longPress':
        return (
          <TouchableOpacity
            onLongPress={this.toggleTooltip}
            activeOpacity={1}
            {...this.props.toggleWrapperProps}
          >
            {children}
          </TouchableOpacity>
        );
      default:
        return children;
    }
  };

  getTooltipStyle = () => {
    const { yOffset, xOffset, elementHeight, elementWidth } = this.state;
    const {
      height,
      backgroundColor,
      width,
      withPointer,
      containerStyle,
      tooltipOffset,
      mainPadding,
      mainBorderRadius,
      position,
    } = this.props;

    const { y } = getTooltipCoordinate(
      xOffset,
      yOffset,
      elementWidth,
      elementHeight,
      ScreenWidth,
      ScreenHeight,
      width,
      withPointer,
    );

    const tooltipPosition = () => {
      if (position === 'center') {
        return ScreenWidth / 2 - width / 2;
      } else if (position === null) {
        if (xOffset > ScreenWidth / 2) {
          return xOffset - width + elementWidth;
        } else {
          return xOffset;
        }
      }
    };

    const tooltipStyle = {
      position: 'absolute',
      left: I18nManager.isRTL ? null : tooltipPosition(),
      right: I18nManager.isRTL ? tooltipPosition() : null,
      width,
      height,
      backgroundColor,
      // default styles
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      borderRadius: mainBorderRadius,
      padding: mainPadding,
      ...containerStyle,
    };

    const pastMiddleLine = yOffset > y;
    if (pastMiddleLine) {
      tooltipStyle.top = yOffset + elementHeight + tooltipOffset + 10;
    } else {
      tooltipStyle.top = y + tooltipOffset;
    }

    return { tooltipStyle, pastMiddleLine, y };
  };

  renderPointer = pastMiddleLine => {
    const { yOffset, xOffset, elementHeight, elementWidth } = this.state;
    const {
      backgroundColor,
      pointerColor,
      pointerStyle,
      tooltipOffset,
    } = this.props;

    return (
      <View
        style={{
          position: 'absolute',
          top: pastMiddleLine
            ? yOffset - 13 - tooltipOffset
            : yOffset + elementHeight - 2 + tooltipOffset,
          left: I18nManager.isRTL ? null : xOffset + elementWidth / 2 - 7.5,
          right: I18nManager.isRTL ? xOffset + elementWidth / 2 - 7.5 : null,
        }}
      >
        <Triangle
          style={{
            borderBottomColor: pointerColor || backgroundColor,
            ...pointerStyle,
          }}
          isDown={pastMiddleLine}
        />
      </View>
    );
  };
  renderContent = withTooltip => {
    const {
      popover,
      withPointer,
      highlightColor,
      actionType,
      closeOnPopover,
      closeIconRender,
      closeIconColor,
      closeIconBackgroundColor,
      withCloseIcon,
    } = this.props;

    if (!withTooltip)
      return this.wrapWithAction(actionType, this.props.children);

    const {
      yOffset,
      xOffset,
      elementWidth,
      elementHeight,
      elementPopoverHeight,
    } = this.state;
    const { tooltipStyle, pastMiddleLine } = this.getTooltipStyle();

    return (
      <React.Fragment>
        <View
          style={{
            position: 'absolute',
            top: yOffset,
            left: I18nManager.isRTL ? null : xOffset,
            right: I18nManager.isRTL ? xOffset : null,
            backgroundColor: highlightColor,
            overflow: 'visible',
            width: elementWidth,
            height: elementHeight,
          }}
        >
          {this.props.children}
        </View>
        {withPointer && this.renderPointer(!tooltipStyle.top)}
        {closeOnPopover ? (
          <TouchableOpacity
            onPress={this.toggleTooltip}
            activeOpacity={1}
            style={tooltipStyle}
            ref={e => (this.renderedPopover = e)}
          >
            <View>{popover}</View>
          </TouchableOpacity>
        ) : (
          <View ref={e => (this.renderedPopover = e)} style={tooltipStyle}>
            {popover}
          </View>
        )}
        {withCloseIcon ? (
          <View
            style={{
              width: 31,
              height: 31,
              position: 'absolute',
              right: tooltipStyle.right + (tooltipStyle.width - 20),
              left: tooltipStyle.left + (tooltipStyle.width - 20),
              top: pastMiddleLine ? null : Number(tooltipStyle.top) - 15,
              bottom: pastMiddleLine
                ? tooltipStyle.bottom + elementPopoverHeight - 15
                : null,
              zIndex: 10,
              borderRadius: 31,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: closeIconBackgroundColor,
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
          >
            <TouchableOpacity
              onPress={() => {
                this.toggleTooltip();
              }}
              style={{ padding: 15 }}
            >
              {closeIconRender ? (
                closeIconRender
              ) : (
                <IconClose fill={closeIconColor} />
              )}
            </TouchableOpacity>
          </View>
        ) : null}
      </React.Fragment>
    );
  };

  componentDidMount() {
    // wait to compute onLayout values.
    // eslint-disable-next-line no-undef
    const initElem = new Promise(resolve => {
      let interval = setInterval(() => {
        //@ts-ignore
        if (this.renderedPopover && this.renderedElement) {
          clearInterval(interval);
          resolve();
        }
      }, 10);
    });
    initElem.then(() => {
      setTimeout(() => {
        this.getElementPosition();
      }, 1);
    });
  }

  componentWillUnmount() {
    clearTimeout(this.timeout);
  }

  getElementPosition = () => {
    this.renderedElement &&
      this.renderedElement.measureInWindow(
        (pageOffsetX, pageOffsetY, width, height) => {
          this.state.isVisible &&
            this.setState({
              xOffset: pageOffsetX,
              yOffset: pageOffsetY,
              elementWidth: width,
              elementHeight: height,
            });
        },
      );

    this.renderedPopover &&
      this.renderedPopover.measureInWindow(
        (pageOffsetX, pageOffsetY, width, height) => {
          this.state.isVisible &&
            this.setState({
              elementPopoverYOffset: pageOffsetY,
              elementPopoverHeight: height,
            });
        },
      );
  };

  render() {
    const { isVisible } = this.state;
    const {
      onClose,
      withOverlay,
      onOpen,
      overlayColor,
      closeOnOverlay,
      onRequestClose,
    } = this.props;

    return (
      <View collapsable={false} ref={e => (this.renderedElement = e)}>
        {this.renderContent(false)}
        <Modal
          animationType="fade"
          visible={isVisible}
          transparent
          onDismiss={onClose}
          onShow={onOpen}
          onRequestClose={() => {
            onRequestClose && onClose();
          }}
        >
          <TouchableOpacity
            style={styles.container(withOverlay, overlayColor)}
            {...(closeOnOverlay ? { onPress: this.toggleTooltip } : {})}
            activeOpacity={0.9}
          />
          {this.renderContent(true)}
        </Modal>
      </View>
    );
  }
}

Tooltip.propTypes = {
  children: PropTypes.element,
  withPointer: PropTypes.bool,
  popover: PropTypes.element,
  withCloseIcon: PropTypes.bool,
  closeIconRender: PropTypes.element,
  closeIconColor: PropTypes.string,
  closeIconBackgroundColor: PropTypes.string,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  containerStyle: ViewPropTypes.style,
  pointerColor: PropTypes.string,
  pointerStyle: PropTypes.object,
  onClose: PropTypes.func,
  onOpen: PropTypes.func,
  withOverlay: PropTypes.bool,
  closeOnOverlay: PropTypes.bool,
  closeOnPopover: PropTypes.bool,
  onRequestClose: PropTypes.bool,
  tooltipOffset: PropTypes.number,
  mainPadding: PropTypes.number,
  mainBorderRadius: PropTypes.number,
  toggleWrapperProps: PropTypes.object,
  overlayColor: PropTypes.string,
  backgroundColor: PropTypes.string,
  highlightColor: PropTypes.string,
  actionType: PropTypes.oneOf(['press', 'longPress', 'none']),
  position: PropTypes.string,
};

Tooltip.defaultProps = {
  position: null,
  withCloseIcon: false,
  closeIconColor: 'black',
  closeIconBackgroundColor: 'gray',
  toggleWrapperProps: {},
  withOverlay: true,
  closeOnOverlay: true,
  closeOnPopover: true,
  tooltipOffset: 0,
  mainPadding: 10,
  mainBorderRadius: 10,
  highlightColor: 'transparent',
  withPointer: true,
  actionType: 'press',
  onRequestClose: true,
  height: 40,
  width: 150,
  containerStyle: {},
  pointerStyle: {},
  backgroundColor: '#617080',
  onClose: () => {},
  onOpen: () => {},
};

const styles = {
  container: (withOverlay, overlayColor) => ({
    backgroundColor: withOverlay
      ? overlayColor
        ? overlayColor
        : 'rgba(250, 250, 250, 0.70)'
      : 'transparent',
    flex: 1,
  }),
};

export default Tooltip;

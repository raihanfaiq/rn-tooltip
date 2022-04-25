//  @flow

import * as React from 'react';
import {
  TouchableOpacity,
  Modal,
  View,
  ViewPropTypes as RNViewPropTypes,
  I18nManager,
} from 'react-native';
import PropTypes from 'prop-types';

import Triangle from './Triangle';
import {
  ScreenWidth,
  ScreenHeight,
  isIOS,
  ActualScreenHeight,
} from './helpers';
import getTooltipCoordinate from './getTooltipCoordinate';
import { IconButton } from '../../../components/atoms/IconButton';
import { Icon } from '../../../components/quarks/Icon';

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
  height: number | string,
  width: number | string,
  isVisible: boolean,
  containerStyle: any,
  pointerColor: string,
  pointerStyle: {},
  onClose: () => void,
  onOpen: () => void,
  withOverlay: boolean,
  closeOnOverlay: boolean,
  closeOnPopover: boolean,
  tooltipOffset: number,
  mainPadding: number,
  mainBorderRadius: number,
  overlayColor: string,
  backgroundColor: string,
  highlightColor: string,
  toggleWrapperProps: {},
  actionType: 'press' | 'longPress' | 'none',
};

class Tooltip extends React.Component<Props, State> {
  state = {
    isVisible:
      this.props.isVisible !== undefined ? this.props.isVisible : false,
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
    } = this.props;

    const { x, y } = getTooltipCoordinate(
      xOffset,
      yOffset,
      elementWidth,
      elementHeight,
      ScreenWidth,
      ScreenHeight,
      width,
      withPointer,
    );

    const tooltipStyle = {
      position: 'absolute',
      left: I18nManager.isRTL ? null : x,
      right: I18nManager.isRTL ? x : null,
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
      tooltipStyle.bottom = ActualScreenHeight - y + tooltipOffset;
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
            backgroundColor: '#ffe493',
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
          <IconButton
            onPress={() => {
              this.toggleTooltip();
            }}
            style={{ padding: 15, zIndex: 10 }}
          >
            <Icon variant="cross" />
          </IconButton>
        </View>
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
      }, 100);
    });
    initElem.then(() => {
      this.getElementPosition();
    });
  }

  componentWillUnmount() {
    clearTimeout(this.timeout);
  }

  getElementPosition = () => {
    this.renderedElement &&
      this.renderedElement.measureInWindow(
        (pageOffsetX, pageOffsetY, width, height) => {
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
    } = this.props;

    return (
      <View collapsable={false} ref={e => (this.renderedElement = e)}>
        {this.renderContent(false)}
        <Modal
          animationType="fade"
          visible={
            this.props.isVisible !== undefined && this.props.isVisible
              ? this.props.isVisible
              : this.props.isVisible !== undefined
              ? this.props.isVisible
              : isVisible
          }
          transparent
          onDismiss={onClose}
          onShow={() => {
            this.setState({
              isVisible: true,
            });
            onOpen();
          }}
          onRequestClose={onClose}
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
  isVisible: PropTypes.oneOfType([PropTypes.bool, PropTypes.instanceOf(null)]),
  withPointer: PropTypes.bool,
  popover: PropTypes.element,
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
  tooltipOffset: PropTypes.number,
  mainPadding: PropTypes.number,
  mainBorderRadius: PropTypes.number,
  toggleWrapperProps: PropTypes.object,
  overlayColor: PropTypes.string,
  backgroundColor: PropTypes.string,
  highlightColor: PropTypes.string,
  actionType: PropTypes.oneOf(['press', 'longPress', 'none']),
};

Tooltip.defaultProps = {
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

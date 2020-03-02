import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { expect } from 'chai';
import sinon from 'sinon-sandbox';
import { shallow } from 'enzyme';
import wrap from 'mocha-wrap';
import { forbidExtraProps } from 'airbnb-prop-types';
import contains from 'document.contains';
import objectValues from 'object.values';
import useOutsideClickHandler from '../src/useOutsideClickHandler';

const DISPLAY = {
  BLOCK: 'block',
  FLEX: 'flex',
  INLINE: 'inline',
  INLINE_BLOCK: 'inline-block',
  CONTENTS: 'contents',
};

const propTypes = forbidExtraProps({
  children: PropTypes.node.isRequired,
  onOutsideClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  useCapture: PropTypes.bool,
  display: PropTypes.oneOf(objectValues(DISPLAY)),
});

const defaultProps = {
  disabled: false,

  // `useCapture` is set to true by default so that a `stopPropagation` in the
  // children will not prevent all outside click handlers from firing - maja
  useCapture: true,
  display: DISPLAY.BLOCK,
};

const OutsideClickHandler = ({
  children,
  onOutsideClick,
  disabled,
  useCapture,
  display,
}) => {
  const ref = useRef(null);
  useOutsideClickHandler(ref, onOutsideClick, { disabled, useCapture });

  return (
    <div
      ref={ref}
      style={
        display !== DISPLAY.BLOCK && objectValues(DISPLAY).includes(display)
          ? { display }
          : undefined
      }
    >
      {children}
    </div>
  );
};

OutsideClickHandler.propTypes = propTypes;
OutsideClickHandler.defaultProps = defaultProps;

const document = {
  addEventListener() { },
  removeEventListener() { },
};

describe('useOutsideClickHandler', () => {
  describe('basics', () => {
    it('renders a div', () => {
      expect(shallow(<OutsideClickHandler />).is('div')).to.equal(true);
    });

    it('renders display others than block properly', () => {
      const displays = ['flex', 'inline-block', 'contents', 'inline'];
      displays.forEach((displayType) => {
        const wrapper = shallow(<OutsideClickHandler display={displayType} />);
        expect(wrapper.prop('style')).to.have.property('display', displayType);
      });
    });

    it('does not add `display` style when using the default `block`', () => {
      const wrapper = shallow(<OutsideClickHandler />);
      expect(wrapper.props()).not.to.have.property('display');
    });

    it('renders the children it‘s given', () => {
      const wrapper = shallow(
        <OutsideClickHandler>
          <section id="a" />
          <nav id="b" />
        </OutsideClickHandler>,
      );
      expect(
        wrapper.children().map((x) => ({ type: x.type(), id: x.prop('id') })),
      ).to.eql([
        { type: 'section', id: 'a' },
        { type: 'nav', id: 'b' },
      ]);
    });
  });

  describe('#onOutsideClick()', () => {
    const target = { parentNode: null };
    const event = { target };
    beforeEach(() => {
      target.parentNode = null;
    });

    it('is a noop if `this.childNode` contains `e.target`', () => {
      const spy = sinon.spy();
      const wrapper = shallow(<OutsideClickHandler onOutsideClick={spy} />);
      const instance = wrapper.instance();

      instance.childNode = {};
      target.parentNode = instance.childNode;
      expect(contains(instance.childNode, target)).to.equal(true);

      instance.onMouseUp(event);

      expect(spy).to.have.property('callCount', 0);
    });

    describe('when `this.childNode` does not contain `e.target`', () => {
      it('calls onOutsideClick', () => {
        const spy = sinon.spy();
        const wrapper = shallow(<OutsideClickHandler onOutsideClick={spy} />);
        const instance = wrapper.instance();

        instance.childNode = {};
        expect(contains(instance.childNode, target)).to.equal(false);

        instance.onMouseUp(event);

        expect(spy).to.have.property('callCount', 1);
        expect(spy.firstCall.args).to.eql([event]);
      });
    });
  });

  describe('no zombie event listeners', () => {
    wrap()
      .withGlobal('document', () => document)
      .describe('mocked document', () => {
        beforeEach(() => {
          sinon.spy(document, 'addEventListener');
          sinon.spy(document, 'removeEventListener');
        });

        it('calls onOutsideClick only once and with no extra eventListeners', () => {
          const spy = sinon.spy();
          const wrapper = shallow(<OutsideClickHandler onOutsideClick={spy} />);
          const instance = wrapper.instance();

          instance.onMouseDown();
          instance.onMouseDown();
          instance.onMouseDown();
          instance.onMouseUp();
          expect(document.addEventListener).to.have.property('callCount', 3);
          expect(document.removeEventListener).to.have.property('callCount', 3);
          expect(spy).to.have.property('callCount', 1);
        });

        it('removes all eventListeners after componentWillUnmount', () => {
          const wrapper = shallow(<OutsideClickHandler />);
          const instance = wrapper.instance();

          instance.onMouseDown();
          instance.onMouseDown();
          instance.onMouseDown();

          wrapper.instance().componentWillUnmount();

          expect(document.addEventListener).to.have.property('callCount', 3);
          expect(document.removeEventListener).to.have.property('callCount', 3);
        });
      });
  });
});

describe('OutsideClickHandler display=inline', () => {
  describe('basics', () => {
    it('renders a div', () => {
      expect(
        shallow(<OutsideClickHandler display="inline" />).is('div'),
      ).to.equal(true);
    });

    it('renders the children it‘s given', () => {
      const wrapper = shallow(
        <OutsideClickHandler display="inline">
          <section id="a" />
          <nav id="b" />
        </OutsideClickHandler>,
      );
      expect(
        wrapper.children().map((x) => ({ type: x.type(), id: x.prop('id') })),
      ).to.eql([
        { type: 'section', id: 'a' },
        { type: 'nav', id: 'b' },
      ]);
    });
  });

  describe('#onOutsideClick()', () => {
    const target = { parentNode: null };
    const event = { target };
    beforeEach(() => {
      target.parentNode = null;
    });

    it('is a noop if `this.childNode` contains `e.target`', () => {
      const spy = sinon.spy();
      const wrapper = shallow(
        <OutsideClickHandler onOutsideClick={spy} display="inline" />,
      );
      const instance = wrapper.instance();

      instance.childNode = {};
      target.parentNode = instance.childNode;
      expect(contains(instance.childNode, target)).to.equal(true);

      instance.onMouseUp(event);

      expect(spy).to.have.property('callCount', 0);
    });

    describe('when `this.childNode` does not contain `e.target`', () => {
      it('calls onOutsideClick', () => {
        const spy = sinon.spy();
        const wrapper = shallow(
          <OutsideClickHandler onOutsideClick={spy} display="inline" />,
        );
        const instance = wrapper.instance();

        instance.childNode = {};
        expect(contains(instance.childNode, target)).to.equal(false);

        instance.onMouseUp(event);

        expect(spy).to.have.property('callCount', 1);
        expect(spy.firstCall.args).to.eql([event]);
      });
    });
  });
});

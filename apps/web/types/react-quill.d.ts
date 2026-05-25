declare module 'react-quill' {
  import * as React from 'react';
  
  export interface ReactQuillProps {
    theme?: string;
    value?: string;
    defaultValue?: string;
    readOnly?: boolean;
    placeholder?: string;
    modules?: any;
    formats?: string[];
    className?: string;
    style?: React.CSSProperties;
    onChange?: (content: string, delta: any, source: string, editor: any) => void;
    onChangeSelection?: (selection: any, source: string, editor: any) => void;
    onFocus?: (selection: any, source: string, editor: any) => void;
    onBlur?: (previousSelection: any, source: string, editor: any) => void;
    onKeyDown?: React.EventHandler<any>;
    onKeyPress?: React.EventHandler<any>;
    onKeyUp?: React.EventHandler<any>;
    preserveWhitespace?: boolean;
    bounds?: string | HTMLElement;
  }

  export default class ReactQuill extends React.Component<ReactQuillProps> {
    focus(): void;
    blur(): void;
    getEditor(): any;
  }
}

import { IDefaultOptions } from '../DefaultOptions';
import { ImageResize } from '../ImageResize';

export interface IBaseModule {
    onCreate(): void;
    onDestroy(): void;
    onUpdate(): void;
}

/**
 * Base Module class to assign and pass option variables to other internal modules of ImageResize
 *
 * @export
 * @abstract
 * @class BaseModule
 * @implements {IBaseModule}
 */
export abstract class BaseModule implements IBaseModule {
    protected overlay: HTMLElement;
    protected img: HTMLImageElement;
    protected options: IDefaultOptions;
    protected imageResize: ImageResize;

    public constructor(imageResize: ImageResize) {
        this.overlay = imageResize.overlay;
        this.img = <HTMLImageElement>imageResize.image;
        this.options = imageResize.options;
        this.imageResize = imageResize;
    }

    abstract onCreate(): void;
    abstract onDestroy(): void;
    abstract onUpdate(): void;
}

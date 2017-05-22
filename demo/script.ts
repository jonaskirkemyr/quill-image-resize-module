import * as Quill from 'quill';
import {ImageResize} from '../src/ImageResize';

Quill.register('modules/imageResize', ImageResize);

var quill = new Quill('#editor', {
	theme: 'snow',
	modules: {
		imageResize: {}
	}
});

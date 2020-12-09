import {
    Restful, Action
} from 'core/cgi-package';
import * as path from 'path';
import * as fs from 'fs';

var action = new Action({
    loginRequired: false
});

interface IInputSnapshot {
    imageUri: string;
}

/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<IInputSnapshot>;
type OutputC = Restful.OutputC<any>;

const snapshotPath = path.resolve(__dirname, "../../custom/assets/snapshots");

action.get<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    let { imageUri } = data.inputType;

    let buffer = fs.readFileSync(`${snapshotPath}/${imageUri}`);
    data.response.set('Content-Type', 'image/jpeg');
    data.response.end(buffer);

    return undefined;
});

export default action;
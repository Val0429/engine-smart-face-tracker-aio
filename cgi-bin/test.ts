import {
    Restful, Action
} from "core/cgi-package";

var action = new Action({
    loginRequired: false
});

/********************************
 * C: create object
 ********************************/
type InputR = Restful.InputR<any>;
type OutputR = Restful.OutputR<any>;

action.get<InputR, OutputR>({
    inputType: "InputR"
}, async (data) => {
    return "" as any;
    //return (data.request as any).ntlm as any;
    // return (data.request as any).user as any;
});

export default action;

import { DynamicLoader } from 'helpers/dynamic-loader/dynamic-loader';
import { ScheduleControllerBase, ScheduleActionEmail } from 'models/schedulers/schedulers.base';
import { ScheduleTemplateEmail_ForgetPassword } from '../templates';

export interface IInputScheduleControllerEmail_ForgetPassword {
    user: {
        name: string;
        email: string;
        newpassword: string;
    }
}

@DynamicLoader.set("ScheduleController.Email.ForgetPassword")
export class ScheduleControllerEmail_ForgetPassword extends ScheduleControllerBase<
    IInputScheduleControllerEmail_ForgetPassword,
    ScheduleActionEmail,
    ScheduleTemplateEmail_ForgetPassword
    > {
    
    constructor() {
        super(ScheduleActionEmail, ScheduleTemplateEmail_ForgetPassword);

        this.registerTemplate( async (event, data) => {
            return event;
        });
        this.registerAction( async (event, data) => {
            let { name, email, newpassword } = event.user;
            return {
                to: [email]
            }
        });
    }
}

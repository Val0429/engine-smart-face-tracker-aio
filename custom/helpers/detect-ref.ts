import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

export function detectRef(onCountUpdate: any = ()=>{}) {
    return (source$) => {
        let counter = 0;
        return Observable.defer(() => {
            counter++;
            onCountUpdate(counter);
            return source$;
        })
        .pipe(
            finalize(() => {
                counter--;
                onCountUpdate(counter);
            })
        );
    }
}
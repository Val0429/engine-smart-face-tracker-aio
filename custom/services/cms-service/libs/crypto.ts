import * as crypto from 'crypto-js';
export const CryptoConfig = {
    key: '#$*D%^3('
};
export class CryptoService{
    encrypt4DB(data: string, key: string = CryptoConfig.key): string {
        
        try{
            //let testData = this.decodeBase64(data);            
            //if (!testData) return;
            const mode = crypto.mode.ECB;
            const padding = crypto.pad.ZeroPadding;
            const keyWords = crypto.enc.Utf8.parse(key);
            const encrypted = crypto.DES.encrypt(data, keyWords, {
                mode,
                padding,
            });
            return encrypted.toString();
        }catch (err){
            console.error("encrypt4DB", data);
        }
    }
    decodeBase64(data:any){
        //if(!data)return;
        let buff = new Buffer(data, 'base64');
        let result = buff.toString('utf8');        
        return result;
    }
    decrypt4DB(data: string, key: string = CryptoConfig.key): string {         
        try{
            let testData = this.decodeBase64(data);
            if (!testData) return;
            const mode = crypto.mode.ECB;
            const padding = crypto.pad.ZeroPadding;
            const keyWords = crypto.enc.Utf8.parse(key);
            const decrypted = crypto.DES.decrypt(data, keyWords, {
                mode,
                padding,
            });
            return decrypted.toString(crypto.enc.Utf8);
        }catch (err){
            console.error("decrypt4DB", data);
            //console.error("data", data);
            return data;
        }
    }
}
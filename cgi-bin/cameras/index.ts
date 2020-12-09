import {
    Restful, Action, ParseObject, Errors,
    Cameras, ICameras, EnumConverter, EType
} from 'core/cgi-package';


var action = new Action({
    loginRequired: false
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<ICameras>;
type OutputC = Restful.OutputC<ICameras>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    /// 1) Create Object
    var obj = new Cameras(data.inputType);
    await obj.save(null, { useMasterKey: true });
    Cameras.update(obj);
    /// 2) Output
    return ParseObject.toOutputJSON(obj, {
        type: (v) => EnumConverter(EType)(v)
    });
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<ICameras>;
type OutputR = Restful.OutputR<ICameras>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query(Cameras);
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.parameters, {
        type: (v) => EnumConverter(EType)(v)
    });
});

/********************************
 * U: update object
 ********************************/
type InputU = Restful.InputU<ICameras>;
type OutputU = Restful.OutputU<ICameras>;

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(Cameras).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Cameras <${objectId}> not exists.`]);
    /// 2) Modify
    await obj.save({ ...data.inputType, objectId: undefined });
    Cameras.update(obj);
    /// 3) Output
    return ParseObject.toOutputJSON(obj, {
        type: (v) => EnumConverter(EType)(v)
    });
});

/********************************
 * D: delete object
 ********************************/
type InputD = Restful.InputD<ICameras>;
type OutputD = Restful.OutputD<ICameras>;

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(Cameras).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Cameras <${objectId}> not exists.`]);
    /// 2) Delete
    Cameras.delete(obj);
    obj.destroy({ useMasterKey: true });
    /// 3) Output
    return ParseObject.toOutputJSON(obj, {
        type: (v) => EnumConverter(EType)(v)
    });
});
/// CRUD end ///////////////////////////////////

export default action;

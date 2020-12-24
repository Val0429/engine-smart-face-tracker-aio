#backup assets folder
!insertmacro MoveFolder "$R1\workspace\custom\assets" "${TEMP_FOLDER}\assets" "*.*"

#backup license folder
!insertmacro MoveFolder "$R1\workspace\custom\license" "${TEMP_FOLDER}\license" "*.*"

#backup module data folder
!insertmacro MoveFolder "$R1\workspace\custom\modules\valxnet\build\data" "${TEMP_FOLDER}\data" "*.*"

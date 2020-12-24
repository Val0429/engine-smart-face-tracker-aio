#restore assets folder
!insertmacro MoveFolder "${TEMP_FOLDER}\assets" "$INSTDIR\workspace\custom\assets" "*.*"

#backup license folder
!insertmacro MoveFolder "${TEMP_FOLDER}\license" "$INSTDIR\workspace\custom\license" "*.*"

#backup module data folder
!insertmacro MoveFolder "${TEMP_FOLDER}\data" "$INSTDIR\workspace\custom\modules\valxnet\build\data" "*.*"

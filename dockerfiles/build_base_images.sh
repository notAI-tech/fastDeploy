#!/bin/bash
IMAGENAME=notaitech/fastdeploy
for f in ./*.dockerfile; do
    [ -e "$f" ] || continue
    IMAGETAG=$(basename $f .dockerfile)
    echo "Building: $IMAGENAME:$IMAGETAG ...."
    ########################
    #        BUILD         #
    ########################
    docker build -t $IMAGENAME:$IMAGETAG -f $f ../service/
    # ########################
    # #       PUBLISH        #
    # ########################
    docker push $IMAGENAME:$IMAGETAG
done
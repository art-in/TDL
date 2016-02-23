echo "Building..."
cd ../build
gulp build || { echo "Build failed!"; exit 1; }
echo "Build done." && echo

echo "Successfully done."
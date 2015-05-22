cd ../tests
echo "Static code analysis..."
gulp static-analysis || { echo "Static code analysis failed!"; exit 1; }
echo "Static code analysis done." && echo

cd ../build
echo "Building..."
gulp build || { echo "Build failed!"; exit 1; }
echo "Build done." && echo

cd ../tests
echo "Server tests..."
gulp server || { echo "Server tests failed!"; exit 1; }
echo "Server tests done." && echo

echo "Successfully done." 
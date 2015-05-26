echo "Static code analysis..."
cd ../test
gulp test-static || { echo "Static code analysis failed!"; exit 1; }
echo "Static code analysis done." && echo

echo "Building..."
cd ../build
gulp build || { echo "Build failed!"; exit 1; }
echo "Build done." && echo

echo "Server tests..."
cd ../test
gulp test-server || { echo "Server tests failed!"; exit 1; }
echo "Server tests done." && echo

echo "Successfully done." 
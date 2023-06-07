#include <iostream>
#include <fstream>
#include <string>
using namespace std;

inline char* readFile(const char* filePath) {
	FILE* f = fopen(filePath, "rb");
	fseek(f, 0, SEEK_END);
	long fsize = ftell(f);
	fseek(f, 0, SEEK_SET);

	char* string = (char*)malloc(fsize + 1);
	fread(string, fsize, 1, f);
	fclose(f);

	string[fsize] = 0;
	return string;
}
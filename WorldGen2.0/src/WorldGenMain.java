import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Random;
import java.util.Scanner;

import javax.imageio.ImageIO;

public class WorldGenMain {
	static int width = 1000;
	static int height = 1000;

	static Tile[][] FinalMap = new Tile[width][height];
	static Random rand = new Random();
	static long heightSeed = rand.nextLong();
	static long ampSeed = rand.nextLong();
	static long tempSeed = rand.nextLong();
	static long humiditySeed = rand.nextLong();
	static long cloudSeed = rand.nextLong();
	static OpenSimplexNoise simplex_noise = new OpenSimplexNoise(heightSeed);
	static OpenSimplexNoise amp_noise = new OpenSimplexNoise(ampSeed);
	static OpenSimplexNoise temp_noise = new OpenSimplexNoise(tempSeed);
	static OpenSimplexNoise humidity_noise = new OpenSimplexNoise(humiditySeed);
	static OpenSimplexNoise cloud_noise = new OpenSimplexNoise(cloudSeed);
	static int iteration = 0;
	static double persistance = 0.5;
	static int octaves = 5;
	static double seaLevel = 0.6;
	static double lacunarity = 2.5;
	static double scale = 250;
	public static void main(String args[]) {
		System.out.println(heightSeed);
		System.out.println(ampSeed);
		System.out.println(tempSeed);
		System.out.println();
		createMap();
		createClouds();
		try {
			buildImage(FinalMap);
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		Scanner scanner = new Scanner(System.in);
		while (1 == 1) {
			System.out.println("press s to rescale, and adjust to adjust sea level");
			int response = scanner.nextInt();
			if (response == 0) {
				System.out.println("Put in new sea level:");
				double newSeaLevel = scanner.nextDouble();
				seaLevel = newSeaLevel;
				for (int x = 0; x < width; x++) {
					for (int y = 0; y < width; y++) {
						double h = FinalMap[x][y].getHeight();
						FinalMap[x][y].setHeight(h, newSeaLevel);
					}
				}
			}
			
			else {
				System.out.println("Enter scale");
				scale = scanner.nextInt();
				createMap();
				createClouds();
			}
			
			try {
				buildImage(FinalMap);
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}	
		}
	}
	
	public static void createClouds() {
		for (int x = 0; x < width; x++) {
			for (int y = 0; y < height; y++) {
				Integer[] pos = new Integer[] {x,y};
				double cloudNoise = createClouds(octaves,x,y,persistance,scale,0,1);
				//System.out.println(cloudNoise);
				if (cloudNoise > 0.2) {
					FinalMap[x][y].setCloudAlpha(cloudNoise * 50);
				}
				
			}
		}
	}
	public static void createMap() {
		double seaTiles = 0;
		double landTiles = 0;
		double percC = 0;
		double percL = 0;

		double maxHeight = 0;
		double minHeight = 0;
		for (int x = 0; x < width; x++) {
			for (int y = 0; y < height; y++) {
				Integer[] pos = new Integer[]{x,y};
				double height = createHeight(octaves,x,y,persistance,scale,0,1);
				if (height > maxHeight) {
					maxHeight = height;
				}
				
				if (height < minHeight) {
					minHeight = height;
				}
				double lat = (Math.abs(y - 500) * 0.36) / 2;
				FinalMap[x][y] = new Tile(pos, height, 0.55, lat);
			}
		}
		
		/*Tile[][] tempMap = FinalMap;
		int tempX = 0;
		for (int x  = width / 2; x < width; x++) {
			for (int y = 0; y < height; y++) {
				tempMap[tempX][y] = FinalMap[x][y];
				System.out.println("Moving " + tempX + " " + y + " to " + x + " " + y);
			}
			tempX++;
		}
		
		tempX = width / 2;
		for (int x = 0; x < width / 2; x++) {
			for (int y = 0; y < height; y++) {
				tempMap[tempX][y] = FinalMap[x][y];
			}
			tempX++;
		}*/
		
		//FinalMap = tempMap;
		
		for (int x = 0; x < width; x++) {
			for (int y = 0; y < height; y++) {
				double height = FinalMap[x][y].getHeight();
				height = lerp(minHeight,maxHeight,height);
				FinalMap[x][y].setHeight(height, seaLevel);
				if (FinalMap[x][y].terrain == "Ocean") {
					seaTiles++;
				}
				
				else {
					landTiles++;
				}
			}
		}
		
		
		
		percC = seaTiles / (landTiles + seaTiles);
		percL = 1 - percC;
		percC *= 100;
		percL *= 100;
		System.out.println("The world is " + percC + "% ocean and " + percL + "% land");
		
		try {
			buildImage(FinalMap);
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		for (int x = 0; x < width; x++) {
			for (int y = 0; y < height; y++) {
				Integer[] pos = new Integer[] {x,y};
				double temp = createTemp(octaves,x,y,persistance,scale,0,1);
				//System.out.println(temp + " temp");
				//System.out.println(temp);
				temp*=30;
				temp += 40;
				//System.out.println(temp + " temp");
				FinalMap[x][y].setTemp(temp);
			}
		}
		
		try {
			buildImage(FinalMap);
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		for (int x = 0; x < width; x++) {
			for (int y = 0; y< height; y++) {
				double humidity = createHumidity(octaves,x,y,persistance,scale,0,1);
				
				humidity++;
				humidity /=2;
				//System.out.println(humidity);
				FinalMap[x][y].setHumidity(humidity);
			}
		}
		
		try {
			buildImage(FinalMap);
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		iteration = 0;
		
	}


	public static double lerp(double min, double max, double val) {
		double ans = (val)/(max-min);
		//System.out.println(ans + " ans");
		return ans;
	}
	
	public static double createHeight(int octaves, int x, int y, double persistance, double scale, int low, int high) {
		double maxAmp = 0;
		double curAmp = 1;

		//System.out.println(curAmp);
		double frequency = 1;
		double h = 0;
		
		/*for (int i = 0; i < octaves; i++) {
			height += simplex_noise.eval(x * frequency, y * frequency) * curAmp;
			height += simplex_noise.eval((x*x) * frequency, (y*y*y)*frequency) * curAmp;
			height += simplex_noise.eval((x*x*x) * frequency, (y*y*y)*frequency) * curAmp;
			maxAmp += curAmp;
			curAmp *= persistance;
			frequency *= 2;
		}*/

		for (int i = 0; i < octaves; i++) {
			double sampleX = x / scale;
			double sampleY = y / scale;
			double simplexVal = (simplex_noise.eval(sampleX * frequency, sampleY * frequency));
			simplexVal = (simplexVal + 1) * curAmp;
			//System.out.println(simplexVal);
			
			h += simplexVal;
			
			curAmp *= persistance;
			frequency *= lacunarity;
			//System.out.println("frequency is " + frequency);
			//System.out.println(height);
		}
		double nx = (double)x/width - 0.5;
		double ny = (double)y/height - 0.5;
		double distance = Math.abs(nx) + Math.abs(ny);
		h = (1 + h - (h *distance)) / 2;
		//height /= 3;
		return h;
	}
	
	public static double createClouds(int octaves, int x, int y, double persistance, double scale, int low, int high) {
		double maxAmp = 0;
		double curAmp = 1;

		//System.out.println(curAmp);
		double frequency = 1;
		double cloudNoise = 0;
		
		for (int i = 0; i < octaves; i++) {
			double sampleX = x / scale;
			double sampleY = y / scale;
			double simplexVal = (simplex_noise.eval(sampleX * frequency, sampleY * frequency));
			simplexVal = (simplexVal + 1) * curAmp * 0.5;
			//System.out.println(simplexVal);
			
			cloudNoise += simplexVal;
			
			curAmp *= persistance;
			frequency *= lacunarity;
			//System.out.println("frequency is " + frequency);
			//System.out.println(height);
		}
		cloudNoise = Math.pow(cloudNoise, 3) - 0.5;
		return cloudNoise;
	}
	
	public static double createTemp(int octaves,int x, int y, double persistance, double scale, int low, int high) {
		double maxAmp = 0;
		double curAmp = 1;
		double frequency = 1;
		double temp = 0;
		
		/*for (int i = 0; i < octaves; i++) {
			height += simplex_noise.eval(x * frequency, y * frequency) * curAmp;
			height += simplex_noise.eval((x*x) * frequency, (y*y*y)*frequency) * curAmp;
			height += simplex_noise.eval((x*x*x) * frequency, (y*y*y)*frequency) * curAmp;
			maxAmp += curAmp;
			curAmp *= persistance;
			frequency *= 2;
		}*/
		for (int i = 0; i < octaves; i++) {
			double sampleX = x / scale;
			double sampleY = y / scale;
			double simplexVal = (temp_noise.eval(sampleX * frequency, sampleY * frequency));
			simplexVal = (simplexVal) * curAmp;
			//System.out.println(simplexVal);
			
			temp += simplexVal;
			
			curAmp *= persistance;
			frequency *= lacunarity;
			//System.out.println("frequency is " + frequency);
			//System.out.println(height);
		}

		return temp;
	}
	
	public static double createHumidity(int octaves,int x, int y, double persistance, double scale, int low, int high) {
		double maxAmp = 0;
		double curAmp = 1;
		double frequency = 1;
		double temp = 0;
		
		/*for (int i = 0; i < octaves; i++) {
			height += simplex_noise.eval(x * frequency, y * frequency) * curAmp;
			height += simplex_noise.eval((x*x) * frequency, (y*y*y)*frequency) * curAmp;
			height += simplex_noise.eval((x*x*x) * frequency, (y*y*y)*frequency) * curAmp;
			maxAmp += curAmp;
			curAmp *= persistance;
			frequency *= 2;
		}*/
		for (int i = 0; i < octaves; i++) {
			double sampleX = x / scale;
			double sampleY = y / scale;
			double simplexVal = (humidity_noise.eval(sampleX * frequency, sampleY * frequency));
			simplexVal = (simplexVal) * curAmp;
			//System.out.println(simplexVal);
			
			temp += simplexVal;
			
			curAmp *= persistance;
			frequency *= lacunarity;
			//System.out.println("frequency is " + frequency);
			//System.out.println(height);
		}

		return temp;
	}
	
	public static void buildImage(Tile[][] tiles) throws IOException {

		BufferedImage image = null;
		File f = null;
		Graphics2D g;
		//System.out.println("Iteration: " + iteration);
		try{
			f = new File("D:\\Users\\Owner\\Desktop\\images\\image" + iteration + ".jpg");
			image = ImageIO.read(f);
			//System.out.println("Reading complete.");
			} catch(IOException e){
			  // some code goes here...
		}
		
		g = image.createGraphics();
		
		
		
		try {
			for (int x = 0; x < width; x++) {
				for (int y = 0; y < height; y++) {
					Tile pix = FinalMap[x][y];
					if (FinalMap[x][y] != null) {
						Color c = new Color(pix.R, pix.G, pix.B);
						image.setRGB(x, y, c.getRGB());
					}
					
					else {
						image.setRGB(x, y, new Color(255,255,255).getRGB());
					}
				}
			}
			
		      f = new File("D:\\Users\\Owner\\Desktop\\images\\image" + iteration + ".jpg");  //output file path
		      ImageIO.write(image, "jpg", f);
		      //System.out.println("Writing complete.");
		    }catch(IOException e){
		      System.out.println("Error: "+e);
		    }
		
		iteration++;
	}
}

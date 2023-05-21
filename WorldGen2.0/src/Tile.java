import java.io.IOException;
import java.util.Random;
import java.util.concurrent.ThreadLocalRandom;
//Tile function
//V.005

//V.001: Created
//V.002: Added secondary types
//V.003: Added rivers
//V.004: Added WIP rainfall simulation

//V.005: Assigned each tile a continent
public class Tile {
	int R;
	int G;
	int B;
	double height;
	Integer[] whereAreWe;
	String terrain = "";
	double temp;
	double lat = 0;
	boolean isOcean = false;
	String subTerrain;
	double seaLevel = 0;
	double rainfall = 0;
	double humidity = 0;
	public Tile(Integer[] pos, double height, double seaLevel, double lat) {
		whereAreWe = pos;
		setHeight(height, seaLevel);
		this.lat = lat;
	}
	
	public void setHeight(double h, double seaLevel) {
		height = h;
		setRGBTerrainMode(seaLevel);
	}

	public void setTemp(double ambientTemp) {
		double latSub =0;
		//System.out.println(lat);
		latSub = (-0.95 * (lat)) / 1.5;
		double heightSub = 0;
		if (isOcean == false) {
			heightSub = (((height - seaLevel) * 8800) / 1000) * -9.8; //according to everyone, temperature drops by 4.3 C every 1km going up
		}
		
		//System.out.println("latsub: " + latSub);
		//System.out.println("Heightsub: " + heightSub + " at " + ((height - seaLevel) * 8800));
		//System.out.println("Ambient temp: " + ambientTemp);
		temp = (ambientTemp + latSub + heightSub);
		
		
		if (temp > 30 && isOcean == false) {
			subTerrain = "Desert";
			R = 255;
			G = 255;
			B = 0;
		}
		
		else if (temp > 5 && isOcean == false) {
			subTerrain = "Temperate";
			R = 144;
			G = 238;
			B = 144;
		}
		else if (temp > -10 && isOcean == false) {
			subTerrain = "Boreal";
			R = 1;
			G = 50;
			B = 32;
		}
		
		else if (temp > -15 && isOcean == false)  {
			subTerrain = "Tundra";
			R = 181;
			G = 101;
			B = 29;
		}
		else if ((temp < -15 && isOcean == false)){
			subTerrain = "Arctic";
			R = 211;
			G = 211;
			B = 211;
		}
		
		if (temp < -20) {
			//System.out.println("ICE!");
			subTerrain = "IceSheet";
			R = 255;
			G = 255;
			B = 255;
		}
		
		//System.out.println(temp + " temp");
		
	}
	public void setRGBTerrainMode(double seaLevel) { //seaLevel by default is 0.55
		this.seaLevel = seaLevel;
		if (height < seaLevel) {
			R = 0;
			G = 0;
			B = 255;
			terrain = "Ocean";
			isOcean = true;
		}
		
		else if (height < seaLevel + 0.02) {
			R = 210;
			G = 208;
			B = 125;
			terrain = "Beach";
		}
		
		else if (height < seaLevel + 0.15) {
			R = 0;
			G = 255;
			B = 0;
			terrain = "Plains";
		}
		
		else if (height < seaLevel + 0.2) {
			R = 139;
			G = 119;
			B = 101;
			terrain = "Highlands";
		}
		
		else {
			R = 105;
			G = 105;
			B = 105;
			terrain = "Mountian";
		}
		/*R = (int)Math.round((255*height));
		G = (int)Math.round((255*height));
		B = (int)Math.round((255*height));*/
		//System.out.println(R + " " + G + " " + B);
	}
	
	public void setRGBHeightMap() {
		R = (int)Math.round(255 * height);
		G = (int)Math.round(255 * height);
		B = (int)Math.round(255 * height);
	}
	
	public void setHumidity(double humidity1) {
		this.humidity = humidity1;
		rainfall = 1000 * humidity1;
		
		if(humidity1 > 0.8 && temp > 20 && isOcean == false) {
			subTerrain = "RainForest";
			R = 0;
			G = 139;
			B = 135;
		}
		else if (humidity1 > 0.65 && temp > 20 && isOcean == false) {
			subTerrain = "Temperate";
			R = 255;
			G = 0;
			B = 0;
		}
		else if (humidity1 > 0.6 && temp > -5 && isOcean == false) {
			subTerrain = "Forest";
			R = 9;
			G = 84;
			B = 2;
		}

		else if (humidity1 > 0.5 && temp > 10 && isOcean == false) {
			subTerrain = "Savanna";
			R = 255;
			G = 165;
			B = 0;
		}

		else if (humidity < 0.25 && temp > 20 && isOcean == false) {
			subTerrain = "Desert";
			R = 255;
			G = 255;
			B = 0;
		}
	}
	public double getHeight() {
		return height;
	}
	
	public void setCloudAlpha(double cloudRGB) {
		R = (int) Math.min(R + cloudRGB, 255);
		G = (int) Math.min(G + cloudRGB, 255);
		B = (int) Math.min(B + cloudRGB, 255);
		//System.out.println(R + " " + G + " " + B);
	}
}

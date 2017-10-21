---
title: Servlet
date: 2016-11-17 22:39:58
tags: [servlet]
---
Servlet是运行在服务器端的一种组件，它是由servlet容器来实例化，初始化，使用，销毁。

每当有用户对该servlet发出请求时，容器就实例化一个对象，然后开启一个线程为该用户服务，当另外有一个用户请求同一个servlet时，就再启动一个线程（但不会再实例一个对象），所以servlet是“单实例，多线程”。

实例化和线程的任务都是由容器完成，程序员只需要关注业务逻辑部分即可（编写doGet doPost方法）

<!-- more -->

# 生命周期
一般的servlet生命周期分为：初始化 对外服务 销毁
初始化调用init()方法
在servlet首次载入后执行一次，并不是每次请求都调用。

对外服务调用service()方法
在新线程中由服务器为每个请求而调用，一般不直接对这个方法编程，而是针对不同的请求方法自动调用相应的doXxx()方法，如doGet doPost

销毁调用destroy()方法
在服务器删除servlet的实例时调用。
并不是每次请求后都调用这个方法

## 例子
名为live的servlet
分别有live构造方法 init destroy service doGet doPost方法
访问该servlet，查看各方法的调用顺序
```java
package tc;

import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class live extends HttpServlet {

	/**
	 * Constructor of the object.
	 */
	public live() {
		super();
		System.out.println("调用构造方法");
	}

	/**
	 * Destruction of the servlet. <br>
	 */
	public void destroy() {
		super.destroy(); // Just puts "destroy" string in log
		// Put your code here
		System.out.println("调用destroy方法");
	}
	
	@Override
	protected void service(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		// TODO Auto-generated method stub
		System.out.println("调用service方法");
		super.service(req, resp);
		
		
	}

	/**
	 * The doGet method of the servlet. <br>
	 * 
	 * This method is called when a form has its tag value method equals to get.
	 * 
	 * @param request
	 *            the request send by the client to the server
	 * @param response
	 *            the response send by the server to the client
	 * @throws ServletException
	 *             if an error occurred
	 * @throws IOException
	 *             if an error occurred
	 */
	public void doGet(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {

		response.setContentType("text/html");
		PrintWriter out = response.getWriter();
		System.out.println("调用doGet方法");
		out.close();
	}

	/**
	 * The doPost method of the servlet. <br>
	 * 
	 * This method is called when a form has its tag value method equals to
	 * post.
	 * 
	 * @param request
	 *            the request send by the client to the server
	 * @param response
	 *            the response send by the server to the client
	 * @throws ServletException
	 *             if an error occurred
	 * @throws IOException
	 *             if an error occurred
	 */
	public void doPost(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {

		response.setContentType("text/html");
		PrintWriter out = response.getWriter();
		System.out.println("调用doPost方法");
		out.close();
	}

	/**
	 * Initialization of the servlet. <br>
	 * 
	 * @throws ServletException
	 *             if an error occurs
	 */
	public void init() throws ServletException {
		// Put your code here
		System.out.println("调用init方法");
	}
}

```
第一次访问
![](http://7xqwwf.com1.z0.glb.clouddn.com/1.png)

 开一个新页面，再次访问
 ![](http://7xqwwf.com1.z0.glb.clouddn.com/2.png)

 可见，只创建了一个实例对象

修改一下代码，把service方法里的父级方法注释掉

```java
protected void service(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		// TODO Auto-generated method stub
		System.out.println("调用service方法");
		// super.service(req, resp);
		
		
}
```
![](http://7xqwwf.com1.z0.glb.clouddn.com/3.png)
由于热部署，原先的servlet实例被销毁，调用destroy()方法
再次访问
![](http://7xqwwf.com1.z0.glb.clouddn.com/4.png)

 又创建了一个新的实例，但是这次没有调用doGet()方法，这是因为：
super.service()，父级的方法中会自动根据请求的类型，自动调用doXxx方法，如果注释掉，那么就不会自动调用doGet方法了

# servlet部署
部署是通过web.xml部署的
通过两组标签共同配置的
```xml
<servlet></servlet>
<servlet-mapping></servlet-mapping>
```
```xml
// 1.相同的servlet-name让它们走到了一起
// 2. 外部只知道url-pattern,对内部一无所知
// 3. 内部知道servlet-class这个实际的类
<servlet>
    <description>This is the description of my J2EE component</description>
    <display-name>This is the display name of my J2EE component</display-name>
    <servlet-name>live</servlet-name>
    <servlet-class>tc.live</servlet-class>
</servlet>  
<servlet-mapping>
    <servlet-name>live</servlet-name>
    <url-pattern>/live</url-pattern>
</servlet-mapping>  
```
工作流程：
用户输入http://localhost:8080/live 对资源发起请求.
容器收到这个请求，在配置文件web.xml里的serlvet-mapping标签里面找，如果有url-pattern配对，就找到了servlet-name为live
然后接着找servlet标签，如果有和live配对的servlet-name，就找到了servlet-class，然后运行tc.live这个文件，并将其实例化。

我们可以修改url-pattern为/tc/live
那么输入http://localhost:8080/tc/live 才能访问该资源

我们还可以同时修改两个servlet-name，只要两个servlet-name相同即可，因为最后是调用servlet-class，只要servlet-class正确即可。

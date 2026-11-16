from lib import *
from scipy.optimize import least_squares
from scipy.special import erf
Y=load_Y()
# 1-D edge model: pixel value = integral over pixel of Phi((x-e)/s) (white side to the right-> rising)
def model(xc, e, s):
    # integral of normal CDF over [xc-.5, xc+.5]
    def G(u):  # antiderivative of Phi(u/s)*... with scale s: int Phi((x-e)/s) dx
        z=(u-e)/s
        return s*(z*0.5*(1+erf(z/np.sqrt(2))) + np.exp(-z*z/2)/np.sqrt(2*np.pi))
    return G(xc+.5)-G(xc-.5)
prof=[]
f=cov(Y,RED,WHITE); prof.append(('redL', np.arange(70,82)+.5, f[200,70:82]))
prof.append(('redT', np.arange(44,56)+.5, f[44:56,150]))
prof.append(('redR', -(np.arange(296,308)+.5), f[200,296:308]))
fF=cov(Y,WHITE,RED); prof.append(('F_left', np.arange(126,136)+.5, fF[300,126:136]))
prof.append(('F_top', np.arange(205,215)+.5, fF[205:215,140]))
prof.append(('F_stemR', -(np.arange(164,174)+.5), fF[330,164:174]))
g=cov(Y,GREEN,WHITE); prof.append(('grnL', np.arange(303,315)+.5, g[200,303:315]))
b=cov(Y,BLUE,WHITE); prof.append(('bluL', np.arange(564,576)+.5, b[200,564:576]))
for nm,x,v in prof:
    r=least_squares(lambda p: model(x,p[0],p[1])-v, [x[len(x)//2],0.5], bounds=([-1e4,0.05],[1e4,5]))
    print(nm,'edge %.3f sigma %.3f resid %.3f'%(abs(r.x[0]),r.x[1],np.abs(r.fun).max()))
